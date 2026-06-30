"""Storage abstraction.

When S3 is configured (settings.s3_enabled) uploads and generated assets are
written to the bucket and their public URLs are returned. Otherwise everything
falls back to local disk under data/, served read-only at /media.

`save_upload` / `save_output` return a *locator string*: an absolute https URL
for S3, or a local path / `/media/...` URL for disk. Downstream code (the Gemini
loader, the reference encoder, the frontend `mediaUrl`) already handles both.
"""
from __future__ import annotations

import functools
import mimetypes
from pathlib import Path

from .config import settings


# --- local disk ---------------------------------------------------------------
def job_output_dir(job_id: str) -> Path:
    d = settings.outputs_dir / job_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def media_url(path: Path) -> str:
    """Relative URL under /media for a file inside data/."""
    rel = path.relative_to(settings.data_dir)
    return f"/media/{rel.as_posix()}"


# --- S3 -----------------------------------------------------------------------
@functools.lru_cache(maxsize=1)
def _s3_client():
    import boto3  # imported lazily so the app runs without the dep when S3 is off

    return boto3.client(
        "s3",
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        endpoint_url=settings.s3_endpoint_url or None,
    )


def _s3_url(key: str) -> str:
    if settings.s3_public_base_url:
        return f"{settings.s3_public_base_url.rstrip('/')}/{key}"
    if settings.s3_endpoint_url:
        return f"{settings.s3_endpoint_url.rstrip('/')}/{settings.s3_bucket}/{key}"
    return f"https://{settings.s3_bucket}.s3.{settings.s3_region}.amazonaws.com/{key}"


def _put_s3(key: str, data: bytes, content_type: str) -> str:
    _s3_client().put_object(Bucket=settings.s3_bucket, Key=key, Body=data, ContentType=content_type)
    return _s3_url(key)


# --- public API ---------------------------------------------------------------
def save_upload(job_id: str, filename: str, data: bytes) -> str:
    suffix = Path(filename).suffix or ".png"
    content_type = mimetypes.guess_type(filename)[0] or "image/png"
    if settings.s3_enabled:
        return _put_s3(f"uploads/{job_id}{suffix}", data, content_type)
    dest = settings.uploads_dir / f"{job_id}{suffix}"
    dest.write_bytes(data)
    return str(dest)


def save_output(job_id: str, output_type: str, data: bytes,
                suffix: str = ".png", content_type: str = "image/png") -> str:
    """Persist a generated asset and return its URL."""
    if settings.s3_enabled:
        return _put_s3(f"outputs/{job_id}/{output_type}{suffix}", data, content_type)
    out = job_output_dir(job_id) / f"{output_type}{suffix}"
    out.write_bytes(data)
    return media_url(out)
