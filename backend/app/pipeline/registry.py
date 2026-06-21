"""Loads per-output-type pipeline definitions from YAML.

Each output type (on_model, ghost_mannequin, banner, video) is described by a
YAML file under configs/pipelines/. A pipeline is an ordered list of stages;
the runner executes them in order, threading a shared context dict. This is the
config-driven core: adding/altering an asset type is a YAML change, not code.
"""
from __future__ import annotations

import functools

import yaml

from ..config import settings


@functools.lru_cache(maxsize=1)
def load_pipelines() -> dict[str, dict]:
    pipelines: dict[str, dict] = {}
    pipelines_dir = settings.config_dir / "pipelines"
    for path in sorted(pipelines_dir.glob("*.yaml")):
        data = yaml.safe_load(path.read_text()) or {}
        output_type = data.get("output_type") or path.stem
        pipelines[output_type] = data
    return pipelines


def get_pipeline(output_type: str) -> dict | None:
    return load_pipelines().get(output_type)


def available_output_types() -> list[str]:
    return sorted(load_pipelines().keys())
