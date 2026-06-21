"""Gemini-backed generation.

Two capabilities used by the on-model pipeline:
  * extract_garment_attributes() — vision call on the uploaded flatlay.
  * compose_on_model() — multi-reference image composition (garment + model +
    pose + background reference images -> one on-model photograph) using
    Gemini 2.5 Flash Image ("nano-banana").

When no API key is configured the callers fall back to the Phase 0 mock, so the
app still runs end-to-end without credentials.
"""
from __future__ import annotations

import io
import json
import logging
from pathlib import Path

import httpx
from PIL import Image

from ..config import settings

logger = logging.getLogger("lookbook.gemini")

_client = None


def is_enabled() -> bool:
    """True when a Gemini API key is configured (real generation mode)."""
    return bool(settings.gemini_api_key)


def _get_client():
    global _client
    if _client is None:
        from google import genai  # imported lazily so the app starts without the dep

        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _load_image(src: str | None) -> Image.Image | None:
    """Load a reference image from a local path or an http(s) URL."""
    if not src:
        return None
    try:
        if src.startswith(("http://", "https://")):
            resp = httpx.get(src, timeout=30, follow_redirects=True)
            resp.raise_for_status()
            data = resp.content
        else:
            data = Path(src).read_bytes()
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        logger.exception("failed to load reference image: %s", src)
        return None


def extract_garment_attributes(image_path: str | None) -> dict:
    """Return {garment_type, color, fabric, pattern, details} for the product image."""
    img = _load_image(image_path)
    if img is None:
        raise RuntimeError("no input image to analyze")

    from google.genai import types

    instruction = (
        "You are a fashion product analyst. Look at this product / flatlay image "
        "and describe the garment. Return JSON with keys: garment_type, color, "
        "fabric, pattern, details. Keep each value to a few words."
    )
    resp = _get_client().models.generate_content(
        model=settings.gemini_text_model,
        contents=[instruction, img],
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    return json.loads(resp.text)


def compose_on_model(
    *,
    garment_path: str | None,
    model_url: str | None,
    pose_url: str | None,
    bg_url: str | None,
    prompt: str,
) -> bytes:
    """Generate an on-model photograph from the selected references. Returns PNG/JPEG bytes."""
    from google.genai import types

    garment = _load_image(garment_path)
    if garment is None:
        raise RuntimeError("on-model compose requires the uploaded garment image")

    # Label each reference inline so the model knows the role of each image.
    contents: list = [prompt]
    contents += ["GARMENT — the exact product to dress the model in:", garment]
    if (model_img := _load_image(model_url)) is not None:
        contents += ["MODEL — use this person's face, skin tone and build:", model_img]
    if (pose_img := _load_image(pose_url)) is not None:
        contents += ["POSE — match this body pose / framing:", pose_img]
    if (bg_img := _load_image(bg_url)) is not None:
        contents += ["BACKGROUND — place the model in a scene like this:", bg_img]

    resp = _get_client().models.generate_content(
        model=settings.gemini_image_model,
        contents=contents,
        config=types.GenerateContentConfig(response_modalities=["Text", "Image"]),
    )

    candidates = resp.candidates or []
    for cand in candidates:
        for part in (cand.content.parts or []):
            inline = getattr(part, "inline_data", None)
            if inline and inline.data:
                return inline.data

    # Surface the model's text refusal/explanation when it declines to render.
    text = getattr(resp, "text", None) or "no image returned"
    raise RuntimeError(f"Gemini returned no image: {text}")
