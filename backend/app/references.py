"""Encode reference images as base64 data URLs.

Used by the Puter (browser-side) generation path: the frontend can't fetch the
remote preset image URLs directly (cross-origin), so the backend fetches them
and the uploaded garment from disk and returns data URLs the browser can hand
straight to Puter's `input_images`.
"""
from __future__ import annotations

import base64
import mimetypes
from pathlib import Path

import httpx


def _data_url(data: bytes, mime: str) -> str:
    return f"data:{mime};base64,{base64.b64encode(data).decode()}"


def file_to_data_url(path: str | None) -> str | None:
    if not path:
        return None
    p = Path(path)
    if not p.exists():
        return None
    mime = mimetypes.guess_type(p.name)[0] or "image/png"
    return _data_url(p.read_bytes(), mime)


def url_to_data_url(url: str | None) -> str | None:
    if not url:
        return None
    try:
        resp = httpx.get(url, timeout=30, follow_redirects=True)
        resp.raise_for_status()
        mime = (resp.headers.get("content-type") or "image/jpeg").split(";")[0].strip()
        return _data_url(resp.content, mime or "image/jpeg")
    except Exception:
        return None
