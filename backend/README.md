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

## Run

With the virtual env activated:

```bash
uvicorn app.main:app --reload --host 0.0.0.0
```

- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Routes under `/api/v1`: auth, boards, goals, entries/tasks, entries/journal, progress/board
