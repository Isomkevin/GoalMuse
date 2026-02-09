import json
import logging
import threading
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.agents import run_alignment, run_optimization, run_synergy
from app.agents._opik import get_current_trace_id, track_agent
from app.agents.evals import run_insight_evals_and_log
from app.agents.llm import clear_llm_override, set_llm_override
from app.api.deps import get_current_user_id
from app.config import settings
from app.database import get_db
from app.models import Goal, JournalEntry, Task, VisionBoard, User
from app.models import InsightFeedback
from app.schemas.ai import (
    AlignmentResponse,
    FeedbackCreate,
    GoalPair,
    InsightsResponse,
    OptimizationResponse,
    SynergyResponse,
)

router = APIRouter(prefix="/ai", tags=["ai"])


def _get_board_goals_tasks_journal(db: Session, user_id: str, board_id: str | None):
    """Load first board (or given), its goals, user tasks, recent journal."""
    boards = db.query(VisionBoard).filter(VisionBoard.user_id == user_id).all()
    if not boards:
        return None, [], [], []
    board = next((b for b in boards if b.id == board_id), boards[0])
    goals = db.query(Goal).filter(Goal.board_id == board.id).order_by(Goal.sort_order).all()
    tasks = db.query(Task).filter(Task.user_id == user_id).order_by(Task.created_at.desc()).limit(50).all()
    journal = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
        .limit(10)
        .all()
    )
    return board, goals, tasks, journal


@track_agent(name="insights")
def _run_insights_agents(goals_data, tasks_data, journal_snippets, completed_count):
    """Run all three agents under one Opik trace (alignment, synergy, optimization as child spans)."""
    alignment = run_alignment(goals_data, tasks_data, journal_snippets)
    synergy = run_synergy(goals_data)
    optimization = run_optimization(goals_data, tasks_data, completed_count)
    return alignment, synergy, optimization


@router.get("/insights", response_model=InsightsResponse)
def get_insights(
    board_id: str | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Run all three agents and return alignment, synergy, and one next action. Uses user's LLM preference if set."""
    board, goals, tasks, journal = _get_board_goals_tasks_journal(db, user_id, board_id)
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No board found")

    user = db.query(User).filter(User.id == user_id).first()
    prefs = None
    if user and user.llm_preferences:
        try:
            prefs = json.loads(user.llm_preferences) if isinstance(user.llm_preferences, str) else user.llm_preferences
        except Exception:
            prefs = None
    if prefs and prefs.get("provider"):
        model = prefs.get("model") or prefs.get(f"{prefs['provider']}_model")
        set_llm_override(provider=prefs["provider"], model=model)
    try:
        goals_data = [{"id": g.id, "title": g.title, "description": g.description or ""} for g in goals]
        tasks_data = [
            {"id": t.id, "title": t.title, "goal_id": t.goal_id, "completed_at": t.completed_at.isoformat() if t.completed_at else None}
            for t in tasks
        ]
        journal_snippets = [j.content for j in journal]
        completed_count = sum(1 for t in tasks if t.completed_at)

        alignment, synergy, optimization = _run_insights_agents(
            goals_data, tasks_data, journal_snippets, completed_count
        )
    finally:
        clear_llm_override()

    trace_id = get_current_trace_id()

    pairs = [
        GoalPair(goal_ids=p.get("goal_ids", []) or [], reason=p.get("reason", "") or "")
        for p in synergy.get("pairs", [])
        if isinstance(p, dict)
    ]

    response = InsightsResponse(
        alignment=AlignmentResponse(score=alignment["score"], explanation=alignment["explanation"]),
        synergy=SynergyResponse(
            pairs=pairs,
            compound_actions=synergy.get("compound_actions", []) or [],
            explanation=synergy.get("explanation", "") or "",
        ),
        optimization=OptimizationResponse(
            action=optimization.get("action", "") or "Choose your next task.",
            reason=optimization.get("reason", "") or "",
            goal_id=optimization.get("goal_id"),
        ),
        trace_id=trace_id,
    )

    if trace_id and settings.opik_run_evals:
        goals_summary = "\n".join(f"- {g.get('title', '')}: {g.get('description', '')}" for g in goals_data)
        threading.Thread(
            target=run_insight_evals_and_log,
            args=(trace_id, goals_summary, alignment, synergy, optimization),
            daemon=True,
        ).start()

    return response


def _feedback_value(rating: str) -> float:
    """Map yes/no/somewhat to numeric score for Opik."""
    return {"yes": 1.0, "somewhat": 0.5, "no": 0.0}.get(rating, 0.0)


@router.post("/feedback", response_model=dict)
def submit_feedback(
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Store 'Did this help?' feedback (yes / no / somewhat). Optionally log to Opik trace."""
    rating = (data.rating or "").strip().lower()
    if rating not in ("yes", "no", "somewhat"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="rating must be yes, no, or somewhat")
    fb = InsightFeedback(user_id=user_id, rating=rating)
    db.add(fb)
    db.commit()

    if data.trace_id and settings.opik_api_key:
        try:
            import opik
            opik.Opik().log_traces_feedback_scores(
                scores=[
                    {
                        "id": data.trace_id,
                        "name": "user_feedback",
                        "value": _feedback_value(rating),
                        "reason": rating,
                        "project_name": settings.opik_project_name or "goal-muse",
                    }
                ]
            )
        except Exception as e:
            logging.getLogger(__name__).warning("Opik feedback log failed: %s", e)

    return {"ok": True}
