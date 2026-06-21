"""Stage handlers.

Each handler takes the shared `ctx` dict plus its stage config and returns a
dict merged back into `ctx`. Stages are wired per output type in the YAML
configs and dispatched by their `type`.

Phase 0 ships MOCK implementations that exercise the real toolchain (Pillow for
images/banners, ffmpeg for video) so the end-to-end job → poll → gallery flow
works today. Phase 1-3 replace the marked handlers with Gemini (attribute
extraction), the reasoning prompt builder, and SDXL rendering — same signatures,
no runner changes.
"""
from __future__ import annotations

import logging
import subprocess
import textwrap
from pathlib import Path
from typing import Callable

from PIL import Image, ImageDraw, ImageFont

from .. import storage
from . import gemini

logger = logging.getLogger("lookbook.stages")

StageHandler = Callable[[dict, dict], dict]

_PALETTE_FALLBACK = ["#1A202C", "#2D3748", "#4A5568"]


def _font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for candidate in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ):
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    try:
        return ImageFont.load_default(size=size)  # Pillow >= 10
    except TypeError:
        return ImageFont.load_default()


def _placeholder_image(ctx: dict, w: int, h: int, heading: str) -> Path:
    """Draw a labelled placeholder so the gallery renders before SDXL exists."""
    brand = ctx.get("brand_kit") or {}
    palette = (brand.get("color_palette") or _PALETTE_FALLBACK)[:3] or _PALETTE_FALLBACK
    bg = palette[0]
    img = Image.new("RGB", (w, h), bg)
    draw = ImageDraw.Draw(img)

    # palette swatches along the bottom
    sw = w // max(len(palette), 1)
    for i, color in enumerate(palette):
        draw.rectangle([i * sw, h - 60, (i + 1) * sw, h], fill=color)

    draw.text((40, 40), "LookBook AI", font=_font(40), fill="#FFFFFF")
    draw.text((40, 100), heading, font=_font(54), fill="#FFFFFF")

    lines = [
        f"model: {brand.get('ethnicity', '-')}, {brand.get('age', '-')}, {brand.get('body_type', '-')}",
        f"scene: {brand.get('scene', '-')}  |  light: {brand.get('lighting', '-')}",
        f"bg: {brand.get('background', '-')}",
    ]
    prompt = ctx.get("prompt") or ""
    if prompt:
        lines.append("")
        lines += textwrap.wrap("prompt: " + prompt, width=46)[:6]

    y = 190
    for line in lines:
        draw.text((40, y), line, font=_font(26), fill="#E2E8F0")
        y += 38

    out = storage.job_output_dir(ctx["job_id"]) / f"{ctx['output_type']}.png"
    img.save(out)
    return out


# --- Garment attribute extraction (Gemini vision) ----------------------------
_MOCK_ATTRS = {"garment_type": "garment", "color": "", "fabric": "", "pose": "standing, front"}


def extract_attributes(ctx: dict, cfg: dict) -> dict:
    """Read garment attributes from the uploaded image via Gemini.

    Non-fatal: compose works off the actual garment image, so on any failure we
    fall back to generic attributes rather than failing the whole job.
    """
    if gemini.is_enabled():
        try:
            return {"attributes": gemini.extract_garment_attributes(ctx.get("input_image_path"))}
        except Exception:
            logger.exception("attribute extraction failed; using generic attributes")
    return {"attributes": dict(_MOCK_ATTRS)}


# --- Phase 2 (TODO: reasoning model) -----------------------------------------
def build_prompt(ctx: dict, cfg: dict) -> dict:
    # MOCK. Replace with the reasoning prompt builder. Demonstrates the intended
    # structure: brand attributes (ethnicity/age/body type) + scene + lighting.
    brand = ctx.get("brand_kit") or {}
    attrs = ctx.get("attributes") or {}
    template = cfg.get("prompt_template", "{output_type} of {garment}")
    prompt = template.format(
        output_type=ctx["output_type"],
        garment=attrs.get("garment_type", "product"),
        color=attrs.get("color", ""),
        fabric=attrs.get("fabric", ""),
        ethnicity=brand.get("ethnicity", ""),
        age=brand.get("age", ""),
        body_type=brand.get("body_type", ""),
        pose=brand.get("pose", ""),
        scene=brand.get("scene", ""),
        lighting=brand.get("lighting", ""),
        background=brand.get("background", ""),
    )
    return {"prompt": " ".join(prompt.split())}


# --- On-model composition (Gemini 2.5 Flash Image) ---------------------------
def onmodel_compose(ctx: dict, cfg: dict) -> dict:
    """Generate the on-model shoot from the selected garment/model/pose/background.

    Real generation when a Gemini key is set; on failure the exception propagates
    so the asset is marked `failed` with the reason (the user asked for real
    output, so we don't hide errors behind a placeholder). Without a key we keep
    the Phase 0 mock placeholder so the app still runs.
    """
    if not gemini.is_enabled():
        size = cfg.get("size", [1024, 1024])
        out = _placeholder_image(ctx, int(size[0]), int(size[1]), cfg.get("heading", ctx["output_type"]))
        return {"output_path": out, "url": storage.media_url(out)}

    brand = ctx.get("brand_kit") or {}
    data = gemini.compose_on_model(
        garment_path=ctx.get("input_image_path"),
        model_url=brand.get("model_image"),
        pose_url=brand.get("pose_image"),
        bg_url=brand.get("background_image"),
        prompt=ctx.get("prompt") or "Photorealistic on-model fashion photograph.",
    )
    out = storage.job_output_dir(ctx["job_id"]) / f"{ctx['output_type']}.png"
    out.write_bytes(data)
    return {"output_path": out, "url": storage.media_url(out)}


# --- Phase 3 (TODO: SDXL on MPS) ---------------------------------------------
def sdxl_render(ctx: dict, cfg: dict) -> dict:
    size = cfg.get("size", [1024, 1024])
    out = _placeholder_image(ctx, int(size[0]), int(size[1]), cfg.get("heading", ctx["output_type"]))
    return {"output_path": out, "url": storage.media_url(out)}


def banner_compose(ctx: dict, cfg: dict) -> dict:
    # MOCK banner: SDXL background + Pillow text comes later. For now, a labelled
    # wide placeholder. NOTE: one section == one render (lesson from the A+ bug).
    size = cfg.get("size", [1280, 720])
    out = _placeholder_image(ctx, int(size[0]), int(size[1]), cfg.get("heading", "BANNER"))
    return {"output_path": out, "url": storage.media_url(out)}


def kenburns_video(ctx: dict, cfg: dict) -> dict:
    """Build a Ken Burns (pan/zoom) promo clip from a still via ffmpeg."""
    size = cfg.get("size", [1024, 1024])
    frame = _placeholder_image(ctx, int(size[0]), int(size[1]), cfg.get("heading", "PROMO"))
    duration = int(cfg.get("duration_s", 3))
    out = storage.job_output_dir(ctx["job_id"]) / f"{ctx['output_type']}.mp4"
    w, h = int(size[0]), int(size[1])
    vf = (
        f"scale={w}:{h},zoompan=z='min(zoom+0.0015,1.3)':"
        f"d={duration * 30}:s={w}x{h}:fps=30,format=yuv420p"
    )
    cmd = [
        "ffmpeg", "-y", "-loop", "1", "-i", str(frame),
        "-vf", vf, "-t", str(duration), "-r", "30",
        "-c:v", "libx264", "-pix_fmt", "yuv420p", str(out),
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True, timeout=120)
        return {"output_path": out, "url": storage.media_url(out)}
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        # Fallback: still image if ffmpeg is unavailable or fails.
        return {"output_path": frame, "url": storage.media_url(frame)}


STAGE_HANDLERS: dict[str, StageHandler] = {
    "attribute_extraction": extract_attributes,
    "prompt_builder": build_prompt,
    "onmodel_compose": onmodel_compose,
    "sdxl_render": sdxl_render,
    "banner_compose": banner_compose,
    "kenburns_video": kenburns_video,
}
