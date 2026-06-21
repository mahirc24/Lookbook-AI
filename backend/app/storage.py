"""Local-disk storage. Files under data/ are served read-only at /media."""
from __future__ import annotations

from pathlib import Path

from .config import settings


def job_output_dir(job_id: str) -> Path:
    d = settings.outputs_dir / job_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_upload(job_id: str, filename: str, data: bytes) -> Path:
    suffix = Path(filename).suffix or ".png"
    dest = settings.uploads_dir / f"{job_id}{suffix}"
    dest.write_bytes(data)
    return dest


def media_url(path: Path) -> str:
    """Relative URL under /media for a file inside data/. The frontend prefixes
    the API base URL (e.g. http://localhost:8000)."""
    rel = path.relative_to(settings.data_dir)
    return f"/media/{rel.as_posix()}"
