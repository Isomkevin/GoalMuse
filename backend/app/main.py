import logging
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.config import settings
from app.database import Base, engine, migrate_sqlite_add_columns, SessionLocal
from app.api.routes import auth, boards, entries, goals, progress, ai, voice, opik_dashboard
from app.seed_demo import seed_demo_data

logger = logging.getLogger(__name__)

DEMO_EMAIL = "demo@goalmuse.app"
DEMO_PASSWORD = "demo123"


def seed_demo_user():
    """Create demo user if it does not exist. Safe to call on every startup."""
    from app.models import User
    from app.services.auth import hash_password

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == DEMO_EMAIL).first():
            return
        user = User(
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            display_name="Demo User",
        )
        db.add(user)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # On Vercel (serverless), the filesystem is read-only. SQLite cannot write
    # to a local file, so DB init will fail. Use DATABASE_URL with Postgres
    # (e.g. Vercel Postgres, Neon) in production. We run init in try/except so
    # the app still starts and /health works even if DB isn't available.
    try:
        Base.metadata.create_all(bind=engine)
        migrate_sqlite_add_columns()
        seed_demo_user()
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()
    except Exception as e:
        if os.environ.get("VERCEL") and settings.database_url.startswith("sqlite"):
            logger.warning(
                "Database init skipped on Vercel with SQLite (read-only fs). "
                "Set DATABASE_URL to a Postgres URL (e.g. Vercel Postgres or Neon)."
            )
        else:
            logger.exception("Database init failed during startup: %s", e)
    yield


app = FastAPI(
    title="GoalMuse API",
    version="1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 prefix
app.include_router(auth.router, prefix="/api/v1")
app.include_router(boards.router, prefix="/api/v1")
app.include_router(goals.router, prefix="/api/v1")
app.include_router(entries.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(opik_dashboard.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


# Opik dashboard: single-page view of traces and eval summary (for WebView from app)
_DASHBOARD_HTML = Path(__file__).resolve().parent / "static" / "dashboard.html"


@app.get("/dashboard")
def dashboard_page():
    """Serve the Opik dashboard HTML. Use ?token=JWT to load data (app passes user token)."""
    if _DASHBOARD_HTML.exists():
        return FileResponse(_DASHBOARD_HTML, media_type="text/html")
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Dashboard not found")
