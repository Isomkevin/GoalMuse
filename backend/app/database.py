from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings

# SQLite needs check_same_thread=False for FastAPI; Postgres does not care
connect_args = {} if settings.database_url.startswith("postgresql") else {"check_same_thread": False}
engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _sqlite_column_exists(conn, table: str, column: str) -> bool:
    # Table name is from our code only (safe)
    result = conn.execute(text(f'PRAGMA table_info("{table}")'))
    return any(row[1] == column for row in result.fetchall())


def migrate_sqlite_add_columns():
    """Add new columns to existing SQLite tables. No-op for Postgres or if columns exist."""
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.connect() as conn:
        dialect = conn.dialect.name
        if dialect != "sqlite":
            return
        # users
        if conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='users'")).scalar():
            if not _sqlite_column_exists(conn, "users", "display_name"):
                conn.execute(text("ALTER TABLE users ADD COLUMN display_name VARCHAR(255)"))
            if not _sqlite_column_exists(conn, "users", "plan"):
                conn.execute(text('ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT "free"'))
            if not _sqlite_column_exists(conn, "users", "notification_preferences"):
                conn.execute(text("ALTER TABLE users ADD COLUMN notification_preferences TEXT"))
            if not _sqlite_column_exists(conn, "users", "llm_preferences"):
                conn.execute(text("ALTER TABLE users ADD COLUMN llm_preferences TEXT"))
        # vision_boards
        if conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='vision_boards'")).scalar():
            if not _sqlite_column_exists(conn, "vision_boards", "cover_image_uri"):
                conn.execute(text("ALTER TABLE vision_boards ADD COLUMN cover_image_uri VARCHAR(500)"))
        # goals
        if conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='goals'")).scalar():
            if not _sqlite_column_exists(conn, "goals", "completed"):
                conn.execute(text("ALTER TABLE goals ADD COLUMN completed BOOLEAN DEFAULT 0"))
            if not _sqlite_column_exists(conn, "goals", "priority"):
                conn.execute(text("ALTER TABLE goals ADD COLUMN priority VARCHAR(100)"))
            if not _sqlite_column_exists(conn, "goals", "image_uri"):
                conn.execute(text("ALTER TABLE goals ADD COLUMN image_uri VARCHAR(500)"))
        # journal_entries
        if conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='journal_entries'")).scalar():
            if not _sqlite_column_exists(conn, "journal_entries", "entry_date"):
                conn.execute(text("ALTER TABLE journal_entries ADD COLUMN entry_date DATE"))
        conn.commit()
