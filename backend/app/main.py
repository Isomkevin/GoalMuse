from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine, migrate_sqlite_add_columns, SessionLocal
from app.api.routes import auth, boards, entries, goals, progress, ai, voice

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
    Base.metadata.create_all(bind=engine)
    migrate_sqlite_add_columns()
    seed_demo_user()
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


@app.get("/health")
def health():
    return {"status": "ok"}
