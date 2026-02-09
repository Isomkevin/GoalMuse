# Deploying the Backend to Vercel

This doc explains how to deploy the GoalMuse FastAPI backend to Vercel and how to avoid the `FUNCTION_INVOCATION_FAILED` error.

## Quick fix checklist

1. **Use the backend folder as the Vercel project root**  
   In Vercel Project Settings → General → Root Directory, set to `backend` (so that `index.py` and `app/` are at the root Vercel sees).

2. **Use Postgres, not SQLite, on Vercel**  
   In Vercel Project Settings → Environment Variables, set:
   - `DATABASE_URL` = a Postgres connection string (e.g. from [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or [Neon](https://neon.tech)).

   SQLite uses a local file; Vercel’s serverless filesystem is read-only, so SQLite will cause the function to crash.

3. **Set required env vars**  
   At minimum:
   - `DATABASE_URL` (Postgres URL; required for DB)
   - `SECRET_KEY` (for JWT; use a long random string in production)

   Optional: `OPENAI_API_KEY`, etc., for AI/voice features.

## Why `FUNCTION_INVOCATION_FAILED` happened

- **Runtime crash**: The serverless function process exited due to an unhandled exception (or the runtime crashed).
- **Typical causes for this backend**:
  1. **Wrong entry point**: Vercel looks for an ASGI `app` in `app.py`, `index.py`, or `server.py`. The app lived in `app/main.py`, so we added `backend/index.py` that does `from app.main import app`.
  2. **SQLite on read-only filesystem**: Default `DATABASE_URL` is SQLite. On Vercel, the filesystem is read-only, so creating or writing to `goal_muse.db` fails during startup (e.g. in lifespan), which crashes the function.
  3. **Lifespan failures**: Startup logic (create_all, migrations, seed) ran in lifespan without error handling; any failure there brought down the whole invocation.

## What we changed in the codebase

- **`backend/index.py`**: Vercel entry point that exports the FastAPI `app` from `app.main`.
- **`app/main.py` lifespan**: DB init (create_all, migrate, seed) is wrapped in try/except so a DB failure at startup doesn’t crash the process; the app still starts and `/health` can respond. You still must set a working Postgres `DATABASE_URL` for API routes to work.
- **`backend/vercel.json`**: Optional build/install hints for the backend.

## Deploy steps

1. In Vercel, create a new project (or use an existing one) and connect your repo.
2. Set **Root Directory** to `backend`.
3. Add **Environment Variables**:
   - `DATABASE_URL` = your Postgres URL (required).
   - `SECRET_KEY` = a strong secret for JWT.
4. Deploy. The backend will be served as a serverless function; use the deployed URL as `EXPO_PUBLIC_API_BASE_URL` in the mobile app.

## Mental model: serverless vs long‑running server

- **Long-running server (e.g. `uvicorn` locally)**: One process starts once, handles many requests, and lifespan runs once at startup.
- **Vercel serverless**: Each request (or batch) can run in a new invocation. There is no persistent process; “startup” can run on cold starts, and the filesystem is read-only (or ephemeral).

So:

- Don’t rely on writing to local disk (no SQLite file DB on Vercel).
- Use a hosted DB (Postgres) and set `DATABASE_URL`.
- Keep startup (lifespan) defensive so one failure doesn’t crash the whole function.

## Warning signs to avoid this again

- Using a **local file** (SQLite, file-based cache) in a serverless deployment.
- **No explicit entry point** for the platform (e.g. no `app` in `app.py` / `index.py` / `server.py` for Vercel).
- **Startup logic that can throw** without try/except (migrations, seed, DB create) in lifespan.
- Assuming the **same filesystem or process model** as your local machine.

## Alternatives and trade-offs

- **Keep backend on Vercel with Postgres**: Easiest if you’re already on Vercel; use Vercel Postgres or Neon. Trade-off: cold starts and function limits (e.g. timeout, bundle size).
- **Deploy backend elsewhere**: Run the same FastAPI app on Railway, Render, Fly.io, or a VPS with `uvicorn`. You can keep SQLite for tiny single-node deployments where the filesystem is writable. Trade-off: you manage the server and scaling.
- **Vercel serverless + external Postgres**: What we’re doing now: serverless on Vercel, Postgres elsewhere. Good balance of “no server to manage” and “real database.”

After setting `backend` as root and `DATABASE_URL` (Postgres), redeploy; `FUNCTION_INVOCATION_FAILED` from DB/startup should stop. If it persists, check Vercel’s Function logs for the exact exception.
