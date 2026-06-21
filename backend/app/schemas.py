"""Request/response schemas (API contract for the React frontend)."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BrandKit(BaseModel):
    """Brand guidelines, defined once and reused across every output type.

    The on-model flow is: upload image -> pick a model (ethnicity/age/body_type)
    -> pick a background -> pick a pose -> generate.
    """

    # model
    ethnicity: Optional[str] = None
    age: Optional[str] = None
    body_type: Optional[str] = None
    # scene
    background: Optional[str] = None
    pose: Optional[str] = None
    scene: Optional[str] = None
    lighting: Optional[str] = None
    color_palette: list[str] = Field(default_factory=list)
    # reference image URLs of the selected presets, fed to the generator
    model_image: Optional[str] = None
    pose_image: Optional[str] = None
    background_image: Optional[str] = None


class AssetOut(BaseModel):
    type: str
    status: str
    url: Optional[str] = None
    error: Optional[str] = None


class JobCreateResponse(BaseModel):
    id: str
    status: str


class JobOut(BaseModel):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    product_url: Optional[str] = None
    brand_kit: dict = Field(default_factory=dict)
    output_types: list[str] = Field(default_factory=list)
    assets: list[AssetOut] = Field(default_factory=list)
    error: Optional[str] = None
