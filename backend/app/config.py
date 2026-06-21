"""Application settings and resolved filesystem paths."""
from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="LOOKBOOK_", extra="ignore")

    app_name: str = "LookBook AI"
    # Comma-separated origins allowed by CORS (Vite dev server by default).
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Gemini key is optional in Phase 0 (the pipeline runs in mock mode without it).
    # With a key set, the on-model pipeline performs real generation.
    gemini_api_key: str = ""
    gemini_text_model: str = "gemini-2.5-flash"          # garment attribute extraction
    gemini_image_model: str = "gemini-2.5-flash-image"   # on-model composition ("nano-banana")

    data_dir: Path = BACKEND_DIR / "data"
    config_dir: Path = BACKEND_DIR / "configs"

    @property
    def uploads_dir(self) -> Path:
        return self.data_dir / "uploads"

    @property
    def outputs_dir(self) -> Path:
        return self.data_dir / "outputs"

    @property
    def db_path(self) -> Path:
        return self.data_dir / "lookbook.db"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()

# Ensure the runtime directories exist on import.
for _p in (settings.data_dir, settings.uploads_dir, settings.outputs_dir):
    _p.mkdir(parents=True, exist_ok=True)
