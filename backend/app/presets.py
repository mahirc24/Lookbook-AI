"""Loads selectable presets (model / background / pose) from configs/presets.yaml."""
from __future__ import annotations

import functools

import yaml

from .config import settings


@functools.lru_cache(maxsize=1)
def load_presets() -> dict:
    path = settings.config_dir / "presets.yaml"
    data = yaml.safe_load(path.read_text()) or {}
    return {
        "models": data.get("models", []),
        "backgrounds": data.get("backgrounds", []),
        "poses": data.get("poses", []),
    }
