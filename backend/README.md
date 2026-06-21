# LookBook AI — Backend

Config-driven AI content studio. Turns a product image / flatlay into a full
marketing kit (on-model photoshoot, ghost mannequin, banner, promo video).

**Phase 0 (current):** FastAPI job API + SQLite + the config-driven pipeline,
running in **mock mode** — it produces real placeholder assets (Pillow images +
an ffmpeg Ken Burns video) so the full `create job → poll → gallery` flow works
end-to-end before the ML stages are wired in.

Roadmap: Phase 1 Gemini attribute extraction · Phase 2 reasoning prompt builder
· Phase 3 SDXL render (MPS) · Phase 4 ghost mannequin + banner · Phase 5 video.

## Run

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/jobs` | Create a job (multipart: `image` file or `product_url`, `brand_kit` JSON, `output_types` JSON array) |
| GET | `/jobs/{id}` | Poll job + per-asset status/URLs |
| GET | `/jobs` | List jobs |
| GET | `/output-types` | Available output types (from `configs/pipelines/*.yaml`) |
| GET | `/healthz` | Health check |
| GET | `/media/...` | Generated assets + uploads (static) |

### Example

```bash
curl -X POST http://localhost:8000/jobs \
  -F 'output_types=["on_model","ghost_mannequin","banner","video"]' \
  -F 'brand_kit={"ethnicity":"South Asian","age":"20s","body_type":"athletic","scene":"minimal studio","lighting":"soft diffused","background":"studio seamless","color_palette":["#1A4D2E","#F5EFE6","#E8B04B"]}' \
  -F 'image=@/path/to/flatlay.png'
```

## Config-driven design

Each output type is one YAML file in `configs/pipelines/`. A pipeline is an
ordered list of stages dispatched by `type` to a handler in
`app/pipeline/stages.py`. Adding or changing an asset type is a YAML edit, not
code. Brand guidelines (`brand_kit`) are defined once and injected into every
output type's prompt.
