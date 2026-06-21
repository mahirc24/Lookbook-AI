"""LookBook AI — FastAPI entrypoint."""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import init_db
from .jobs import router as jobs_router
from .pipeline.registry import available_output_types
from .presets import load_presets


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated assets + uploads read-only at /media/...
app.mount("/media", StaticFiles(directory=settings.data_dir), name="media")

app.include_router(jobs_router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict:
    return {"status": "ok", "app": settings.app_name}


@app.get("/output-types", tags=["meta"])
def output_types() -> dict:
    return {"output_types": available_output_types()}


@app.get("/presets", tags=["meta"])
def presets() -> dict:
    return load_presets()
