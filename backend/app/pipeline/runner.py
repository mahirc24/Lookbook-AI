"""Job runner: executes each requested output type's pipeline and updates the
job row so the frontend can poll per-asset progress.

Runs in a FastAPI BackgroundTask (same process, worker thread) — no Celery/Redis
needed at this scale.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy.orm.attributes import flag_modified
from sqlmodel import Session

from ..db import engine
from ..models import Job
from .registry import get_pipeline
from .stages import STAGE_HANDLERS

logger = logging.getLogger("lookbook.runner")


def _save(session: Session, job: Job) -> None:
    job.updated_at = datetime.now(timezone.utc)
    session.add(job)
    session.commit()
    session.refresh(job)


def _set_asset(job: Job, output_type: str, **fields) -> None:
    assets = list(job.assets or [])
    for asset in assets:
        if asset["type"] == output_type:
            asset.update(fields)
            break
    else:
        assets.append({"type": output_type, "status": "queued", "url": None, "error": None, **fields})
    job.assets = assets
    # JSON columns aren't dirty-tracked on in-place mutation; flag it explicitly
    # so the per-asset updates are actually persisted.
    flag_modified(job, "assets")


def run_job(job_id: str) -> None:
    with Session(engine) as session:
        job = session.get(Job, job_id)
        if job is None:
            logger.error("run_job: job %s not found", job_id)
            return

        job.status = "running"
        for output_type in job.output_types:
            _set_asset(job, output_type, status="queued")
        _save(session, job)

        for output_type in job.output_types:
            pipeline = get_pipeline(output_type)
            _set_asset(job, output_type, status="running")
            _save(session, job)

            if pipeline is None:
                _set_asset(job, output_type, status="failed", error="no pipeline config")
                _save(session, job)
                continue

            ctx: dict = {
                "job_id": job_id,
                "output_type": output_type,
                "brand_kit": job.brand_kit or {},
                "input_image_path": job.input_image_path,
                "product_url": job.product_url,
            }
            try:
                for stage in pipeline.get("stages", []):
                    handler = STAGE_HANDLERS.get(stage.get("type"))
                    if handler is None:
                        logger.warning("unknown stage type %r in %s", stage.get("type"), output_type)
                        continue
                    ctx.update(handler(ctx, stage) or {})
                _set_asset(job, output_type, status="completed", url=ctx.get("url"), error=None)
            except Exception as exc:  # noqa: BLE001 - record per-asset failure, keep going
                logger.exception("stage failure for %s", output_type)
                _set_asset(job, output_type, status="failed", error=str(exc))
            _save(session, job)

        statuses = {a["status"] for a in job.assets}
        job.status = "completed" if statuses == {"completed"} else (
            "failed" if statuses == {"failed"} else "completed"
        )
        _save(session, job)
