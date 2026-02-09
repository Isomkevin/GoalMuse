"""
Rich realistic seed data for the demo account (demo@goalmuse.app).
Touches all features: boards, goals, tasks, journal, insight feedback.
Safe to run multiple times: skips seeding if demo user already has boards.
"""
from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Goal, InsightFeedback, JournalEntry, Task, User, VisionBoard
from app.models.journal_entry import journal_entry_goals

DEMO_EMAIL = "demo@goalmuse.app"


# Cover image URLs for demo boards (Unsplash, theme-matched)
BOARD_COVERS = {
    "Career & Growth": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
    "Health & Fitness": "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400",
    "Personal Projects": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
}


def _ensure_demo_board_covers(db: Session, user_id: str) -> None:
    """Update existing demo boards that have no cover image. Safe to run anytime."""
    for title, cover_uri in BOARD_COVERS.items():
        board = db.query(VisionBoard).filter(
            VisionBoard.user_id == user_id,
            VisionBoard.title == title,
            VisionBoard.cover_image_uri.is_(None),
        ).first()
        if board:
            board.cover_image_uri = cover_uri


def seed_demo_data(db: Session) -> None:
    """Seed boards, goals, tasks, journal entries, and feedback for the demo user."""
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if not user:
        return
    existing = db.query(VisionBoard).filter(VisionBoard.user_id == user.id).first()
    if existing:
        _ensure_demo_board_covers(db, user.id)
        db.commit()
        return  # Already seeded

    now = datetime.now(timezone.utc)
    today = date.today()

    # --- Boards ---
    b1 = VisionBoard(
        user_id=user.id,
        title="Career & Growth",
        cover_image_uri=BOARD_COVERS["Career & Growth"],
    )
    b2 = VisionBoard(
        user_id=user.id,
        title="Health & Fitness",
        cover_image_uri=BOARD_COVERS["Health & Fitness"],
    )
    b3 = VisionBoard(
        user_id=user.id,
        title="Personal Projects",
        cover_image_uri=BOARD_COVERS["Personal Projects"],
    )
    db.add_all([b1, b2, b3])
    db.flush()

    # --- Goals (board 1: Career) ---
    g1 = Goal(
        board_id=b1.id,
        title="Ship onboarding flow",
        description="Complete the new user onboarding with email verification and profile setup.",
        target_date=today + timedelta(days=21),
        sort_order=0,
        completed=False,
        priority="high",
    )
    g2 = Goal(
        board_id=b1.id,
        title="Lead weekly team sync",
        description="Run the Monday standup and keep notes in the shared doc.",
        target_date=today + timedelta(days=7),
        sort_order=1,
        completed=True,
        priority="medium",
    )
    g3 = Goal(
        board_id=b1.id,
        title="Complete performance review docs",
        description="Write self-assessment and gather peer feedback.",
        target_date=today + timedelta(days=45),
        sort_order=2,
        completed=False,
        priority="medium",
    )
    db.add_all([g1, g2, g3])
    db.flush()

    # --- Goals (board 2: Health) ---
    g4 = Goal(
        board_id=b2.id,
        title="Run 5K",
        description="Train for and complete a 5K run without walking.",
        target_date=today + timedelta(days=30),
        sort_order=0,
        completed=False,
        priority="high",
    )
    g5 = Goal(
        board_id=b2.id,
        title="Sleep by 11pm on weeknights",
        description="Consistent bedtime to improve focus and recovery.",
        target_date=today + timedelta(days=14),
        sort_order=1,
        completed=False,
        priority="medium",
    )
    db.add_all([g4, g5])
    db.flush()

    # --- Goals (board 3: Personal) ---
    g6 = Goal(
        board_id=b3.id,
        title="Read 2 books this quarter",
        description="One non-fiction, one fiction. Track in Goodreads.",
        target_date=today + timedelta(days=60),
        sort_order=0,
        completed=False,
        priority="low",
    )
    g7 = Goal(
        board_id=b3.id,
        title="Launch side project MVP",
        description="Get the first version live and share with 10 beta users.",
        target_date=today + timedelta(days=90),
        sort_order=1,
        completed=False,
        priority="high",
    )
    db.add_all([g6, g7])
    db.flush()

    # --- Tasks (mix linked and unlinked; some completed) ---
    tasks_data = [
        (g1.id, "Design onboarding screens", True),
        (g1.id, "Implement email verification", False),
        (g1.id, "Add profile completion step", False),
        (g2.id, "Prepare agenda for standup", True),
        (g2.id, "Send recap to team", True),
        (g3.id, "Draft self-assessment", False),
        (g4.id, "Week 1: three 2K runs", True),
        (g4.id, "Week 2: increase to 3K", False),
        (g5.id, "Set nightly reminder 10:30pm", True),
        (None, "Review monthly goals", False),
        (None, "Update vision board", False),
        (g6.id, "Choose first book", True),
        (g7.id, "Set up landing page", False),
    ]
    for goal_id, title, completed in tasks_data:
        t = Task(
            user_id=user.id,
            goal_id=goal_id,
            title=title,
            completed_at=now - timedelta(hours=1) if completed else None,
        )
        db.add(t)
    db.flush()

    # --- Journal entries (some linked to goals) ---
    entries_data = [
        (today.isoformat(), "Focused on onboarding flow today. Wireframes are done; starting implementation tomorrow.", [g1.id]),
        ((today - timedelta(days=1)).isoformat(), "Team sync went well. Everyone aligned on the Q2 priorities.", [g2.id]),
        ((today - timedelta(days=2)).isoformat(), "Morning run felt good. Building up distance slowly.", [g4.id]),
        ((today - timedelta(days=3)).isoformat(), "Reflected on work-life balance. Want to protect evening reading time.", []),
        ((today - timedelta(days=5)).isoformat(), "Side project idea: small tool for daily standup notes. Validating with a few colleagues.", [g7.id]),
        (today.isoformat(), "Quick check-in: feeling on track with career goals, need to step up health routine.", []),
    ]
    for entry_date_str, content, goal_ids in entries_data:
        entry_date = date.fromisoformat(entry_date_str) if entry_date_str else today
        entry = JournalEntry(
            user_id=user.id,
            content=content,
            entry_date=entry_date,
        )
        db.add(entry)
        db.flush()
        if goal_ids:
            for gid in goal_ids:
                db.execute(
                    journal_entry_goals.insert().values(
                        journal_entry_id=entry.id, goal_id=gid
                    )
                )
    db.flush()

    # --- Insight feedback (AI "Did this help?" feature) ---
    fb1 = InsightFeedback(user_id=user.id, rating="yes")
    fb2 = InsightFeedback(user_id=user.id, rating="yes")
    db.add_all([fb1, fb2])

    db.commit()
