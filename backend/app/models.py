"""Database models."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import Column
from sqlalchemy.types import JSON
from sqlmodel import Field, SQLModel


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Job(SQLModel, table=True):
    """A single marketing-kit generation request.

    `assets` holds one entry per requested output type, each tracked
    independently so the frontend can show per-asset progress:
        {"type": "on_model", "status": "queued|running|completed|failed",
         "url": "/media/outputs/<id>/on_model.png", "error": null}
    """

    id: str = Field(primary_key=True)
    status: str = Field(default="queued")  # queued | running | completed | failed
    created_at: datetime = Field(default_factory=_now)
    updated_at: datetime = Field(default_factory=_now)

    product_url: Optional[str] = None
    input_image_path: Optional[str] = None

    brand_kit: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    output_types: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    assets: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSON))

    error: Optional[str] = None
