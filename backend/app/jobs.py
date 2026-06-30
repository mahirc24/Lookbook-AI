"""Job API: create a generation job (server-side Gemini pipeline) and poll its status."""
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from . import storage
from .db import get_session
from .models import Job
from .pipeline.registry import available_output_types
from .pipeline.runner import run_job
from .schemas import BrandKit, JobCreateResponse, JobOut

router = APIRouter(prefix="/jobs", tags=["jobs"])


async def _parse_and_store(output_types: str, brand_kit: str, product_url: str | None,
                           image: UploadFile | None) -> tuple[str, list[str], dict, str | None]:
    """Validate the create-job form and persist the upload. Returns
    (job_id, output_types, brand_kit dict, input_image_path)."""
    try:
        requested = json.loads(output_types)
        brand = BrandKit(**json.loads(brand_kit)).model_dump()
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"invalid JSON in form fields: {exc}")

    if not isinstance(requested, list) or not requested:
        raise HTTPException(status_code=422, detail="output_types must be a non-empty JSON array")

    valid = set(available_output_types())
    unknown = [t for t in requested if t not in valid]
    if unknown:
        raise HTTPException(status_code=422, detail=f"unknown output_types {unknown}; valid: {sorted(valid)}")

    if image is None and not product_url:
        raise HTTPException(status_code=422, detail="provide an image upload or a product_url")

    job_id = uuid.uuid4().hex
    image_path = None
    if image is not None:
        data = await image.read()
        image_path = str(storage.save_upload(job_id, image.filename or "upload.png", data))
    return job_id, requested, brand, image_path


@router.post("", response_model=JobCreateResponse, status_code=201)
async def create_job(
    background: BackgroundTasks,
    session: Session = Depends(get_session),
    output_types: str = Form(..., description='JSON array, e.g. ["on_model","video"]'),
    brand_kit: str = Form("{}", description="JSON object of brand guidelines"),
    product_url: str | None = Form(None),
    image: UploadFile | None = File(None),
) -> JobCreateResponse:
    job_id, requested, brand, image_path = await _parse_and_store(output_types, brand_kit, product_url, image)

    job = Job(
        id=job_id,
        status="queued",
        product_url=product_url,
        input_image_path=image_path,
        brand_kit=brand,
        output_types=requested,
        assets=[{"type": t, "status": "queued", "url": None, "error": None} for t in requested],
    )
    session.add(job)
    session.commit()

    background.add_task(run_job, job_id)
    return JobCreateResponse(id=job_id, status=job.status)


@router.get("/{job_id}", response_model=JobOut)
def get_job(job_id: str, session: Session = Depends(get_session)) -> Job:
    job = session.get(Job, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return job


@router.get("", response_model=list[JobOut])
def list_jobs(session: Session = Depends(get_session)) -> list[Job]:
    return list(session.exec(select(Job).order_by(Job.created_at.desc())).all())
