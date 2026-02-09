"""
One-off migration: add new columns to existing SQLite tables.
Run from backend directory: python scripts/migrate_add_columns.py
Safe to run multiple times (skips columns that already exist).
"""
import sqlite3
import sys
from pathlib import Path

# Resolve backend root and default DB path
backend_root = Path(__file__).resolve().parent.parent
db_path = backend_root / "goal_muse.db"

# Allow DATABASE_URL from env if set
import os
db_url = os.environ.get("DATABASE_URL", f"sqlite:///./goal_muse.db")
if db_url.startswith("sqlite:///"):
    path_part = db_url.replace("sqlite:///", "").lstrip("/")
    if path_part != ":memory:":
        db_path = backend_root / path_part


def column_exists(conn: sqlite3.Connection, table: str, column: str) -> bool:
    cur = conn.execute("PRAGMA table_info(?)", (table,))
    return any(row[1] == column for row in cur.fetchall())


def main():
    if not db_path.exists():
        print(f"Database not found at {db_path}; create_all will create tables on first run.")
        return 0

    conn = sqlite3.connect(str(db_path))
    try:
        # users
        if not column_exists(conn, "users", "display_name"):
            conn.execute("ALTER TABLE users ADD COLUMN display_name VARCHAR(255)")
            print("users: added display_name")
        if not column_exists(conn, "users", "plan"):
            conn.execute('ALTER TABLE users ADD COLUMN plan VARCHAR(50) DEFAULT "free"')
            print("users: added plan")
        if not column_exists(conn, "users", "notification_preferences"):
            conn.execute("ALTER TABLE users ADD COLUMN notification_preferences TEXT")
            print("users: added notification_preferences")

        # vision_boards
        if not column_exists(conn, "vision_boards", "cover_image_uri"):
            conn.execute("ALTER TABLE vision_boards ADD COLUMN cover_image_uri VARCHAR(500)")
            print("vision_boards: added cover_image_uri")

        # goals
        if not column_exists(conn, "goals", "completed"):
            conn.execute("ALTER TABLE goals ADD COLUMN completed BOOLEAN DEFAULT 0")
            print("goals: added completed")
        if not column_exists(conn, "goals", "priority"):
            conn.execute("ALTER TABLE goals ADD COLUMN priority VARCHAR(100)")
            print("goals: added priority")
        if not column_exists(conn, "goals", "image_uri"):
            conn.execute("ALTER TABLE goals ADD COLUMN image_uri VARCHAR(500)")
            print("goals: added image_uri")

        # journal_entries
        if not column_exists(conn, "journal_entries", "entry_date"):
            conn.execute("ALTER TABLE journal_entries ADD COLUMN entry_date DATE")
            print("journal_entries: added entry_date")

        conn.commit()
        print("Migration done.")
    finally:
        conn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
