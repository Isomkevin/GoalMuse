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

## Test Opik, Gemini, and Groq locally (before deploy)

With your `.env` set (e.g. `OPIK_API_KEY`, `OPIK_WORKSPACE`, `OPIK_PROJECT_NAME`, `GOOGLE_API_KEY`, `LLM_PROVIDER=gemini`, `GROQ_API_KEY`, `VOICE_PROVIDER=groq`):

1. **Start the backend** (from `backend` with venv activated):
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0
   ```

2. **Run the smoke test** — this uses your LLM (Gemini when `LLM_PROVIDER=gemini`) and sends a trace to Opik:
   ```bash
   ./scripts/test_api.sh http://localhost:8000
   ```
   - Step [17] calls **GET /api/v1/ai/insights**, which runs the three agents via Gemini and creates an **Opik trace** (if `OPIK_API_KEY` is set).
   - Step [18] sends feedback; if the insights response included `trace_id`, that feedback is logged to that trace in Opik.

3. **Confirm in Opik** — Open your Opik project (e.g. [Comet](https://www.comet.com)) and check the **goal-muse** project for a new trace (name “insights”) with child spans for alignment, synergy, optimization.

4. **Optional: LLM-as-judge evals** — Set `OPIK_RUN_EVALS=true` in `.env`, restart the server, then call insights again (e.g. run the smoke test or use the app). Traces should get extra scores: `alignment_quality`, `next_action_usefulness`, `synergy_relevance`.

5. **Optional: Experiment script** — Run the fixed dataset (uses current `LLM_PROVIDER` and sends traces to Opik):
   ```bash
   python -m scripts.experiments.run_experiment --label gemini
   ```
   Check Opik for one trace per dataset item.

   **Compare all providers (for Settings → Advanced Features):** To populate the in-app "How we compare (Opik)" section so users can see a recommendation when choosing an LLM, run:
   ```bash
   python -m scripts.experiments.run_all_experiments
   ```
   This runs the pipeline for each provider that has an API key and writes `experiment_results/latest.json`. The app reads this for the comparison table and "Recommended: …".

6. **Test Groq (voice)** — With `VOICE_PROVIDER=groq` and `GROQ_API_KEY` set, POST an audio file:
   ```bash
   TOKEN="your_jwt_here"
   curl -X POST "http://localhost:8000/api/v1/voice/transcribe" \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@/path/to/audio.m4a"
   ```
   Use the token from the smoke test login response ([2]) or from the app. A short `.m4a` or `.mp3` is enough to confirm Groq STT works.

If anything fails, check the server logs and `.env` (no typos, keys not quoted). For Opik, ensure the API key and workspace/project match your Comet/Opik account.

## Mobile app (local testing)

Point the mobile app at this backend using `EXPO_PUBLIC_API_BASE_URL`:

- **Android emulator:** use `http://10.0.2.2:8000` (emulator’s alias for host localhost)
- **iOS simulator:** use `http://localhost:8000`
- **Physical device:** use your machine’s LAN IP, e.g. `http://192.168.1.100:8000`, and ensure the device is on the same network
