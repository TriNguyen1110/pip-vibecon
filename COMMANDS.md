# Commands (coordinator-owned; use these exact commands)

Backend (FastAPI, port 8001):
- Install: `cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt`
- Run: `cd backend && .venv/bin/uvicorn server:app --port 8001 --reload`
- Smoke: `curl -s localhost:8001/api/health`
- Env (`backend/.env`, git-ignored; see `backend/.env.example`): `ANTHROPIC_API_KEY` (no key = offline mode),
  `MONGO_URL` + `DB_NAME` (unset = in-memory store), optional `PIP_CHAT_MODEL`, `TWILIO_*`, `STRIPE_SECRET_KEY`.

Frontend (Vite React, port 5173, proxies /api to 8001):
- Install: `cd frontend && npm install`
- Run: `cd frontend && npm run dev`
- Build check: `cd frontend && npm run build`

Emergent: push to GitHub (`TriNguyen1110/pip-vibecon`), then pull the repo into the team lead's
Emergent project; the demoed app is the public Emergent URL.
