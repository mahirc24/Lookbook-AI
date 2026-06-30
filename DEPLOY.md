# Deploying the backend to Render

The backend deploys from `render.yaml` (a Render Blueprint). Steps:

## 1. Push the repo (with render.yaml)
```bash
git add render.yaml DEPLOY.md
git commit -m "Add Render deploy blueprint"
git push
```

## 2. Create the service on Render
1. Go to https://dashboard.render.com → **New + → Blueprint**.
2. Connect the GitHub repo (`mahirc24/Lookbook-AI`).
3. Render reads `render.yaml` and proposes a web service **lookbook-backend**. Click **Apply**.

## 3. Set the environment variables (dashboard → the service → Environment)
| Key | Value |
|---|---|
| `LOOKBOOK_GEMINI_API_KEY` | your `AIza…` key (optional; Puter fallback works without it) |
| `LOOKBOOK_CORS_ORIGINS` | your deployed frontend URL, e.g. `https://lookbook.vercel.app` |
| `LOOKBOOK_S3_BUCKET` | your bucket name |
| `LOOKBOOK_S3_ACCESS_KEY_ID` | IAM access key |
| `LOOKBOOK_S3_SECRET_ACCESS_KEY` | IAM secret |
| `LOOKBOOK_S3_REGION` | e.g. `us-east-1` (preset in blueprint) |

`PYTHON_VERSION` and `LOOKBOOK_S3_REGION` are already set in `render.yaml`.

## 4. Deploy & verify
- Render builds (`pip install -r requirements.txt`) and starts
  (`uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- When live, check: `https://lookbook-backend.onrender.com/healthz` → `{"status":"ok"}`.
- API docs: `https://lookbook-backend.onrender.com/docs`.

## 5. Point the frontend at it
In the frontend host (Vercel/Netlify), set `VITE_API_BASE=https://lookbook-backend.onrender.com`,
and make sure that domain is listed in `LOOKBOOK_CORS_ORIGINS` above.

## Notes / gotchas
- **Free tier sleeps** after ~15 min idle; the first request after that cold-starts (~30–50s).
- **Ephemeral disk:** local `data/` (SQLite + any local media) resets on each redeploy. Configure
  S3 (above) so generated images persist. For persistent job history, swap SQLite for a managed
  Postgres (Render Postgres / Neon) and point the DB at it.
- **Secrets** live only in the Render dashboard — `.env` stays gitignored and is never deployed.
