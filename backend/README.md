# GoalMuse API

FastAPI + SQLite (Postgres-ready). JWT auth, CRUD for boards, goals, tasks, journal.

## Setup (use a virtual env)

From the `backend` directory:

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**Windows (CMD):**
```cmd
python -m venv .venv
.venv\Scripts\activate.bat
pip install -r requirements.txt
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Optional: copy `.env.example` to `.env` and set `SECRET_KEY`, `DATABASE_URL`, or `OPENAI_API_KEY` as needed. Defaults are fine for local testing.

## Run

With the virtual env activated:

```bash
uvicorn app.main:app --reload --host 0.0.0.0
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Health: http://localhost:8000/health
- Routes under `/api/v1`: auth, boards, goals, entries/tasks, entries/journal, progress, ai, voice

On startup, the app creates tables if missing and adds any new columns to existing SQLite DBs (migration). For a one-off migration without starting the server, run: `python scripts/migrate_add_columns.py`.

## Smoke test (curl)

From the `backend` directory (requires `curl` and Python; no jq needed):

```bash
chmod +x scripts/test_api.sh
./scripts/test_api.sh http://localhost:8000
```

Works in Git Bash on Windows (Python is usually available).

This logs in as `demo@goalmuse.app` / `demo123`, then hits auth, boards, goals, tasks, journal, progress, AI, and profile endpoints. Voice transcribe is skipped (requires a real audio file); run manually if needed:

```bash
curl -X POST "http://localhost:8000/api/v1/voice/transcribe" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/audio.m4a"
```

## Mobile app (local testing)

Point the mobile app at this backend using `EXPO_PUBLIC_API_BASE_URL`:

- **Android emulator:** use `http://10.0.2.2:8000` (emulator’s alias for host localhost)
- **iOS simulator:** use `http://localhost:8000`
- **Physical device:** use your machine’s LAN IP, e.g. `http://192.168.1.100:8000`, and ensure the device is on the same network
