from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.agents import run_alignment
from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import Goal, JournalEntry, Task, VisionBoard
from app.schemas.progress import (
    ProgressBoardResponse,
    ProgressConfidenceBreakdown,
    ProgressConfidenceResponse,
    ProgressGoalResponse,
)
from app.services.progress_confidence import compute_confidence

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/board/{board_id}", response_model=ProgressBoardResponse)
def progress_board(
    board_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    board = db.query(VisionBoard).filter(
        VisionBoard.id == board_id,
        VisionBoard.user_id == user_id,
    ).first()
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    goals = db.query(Goal).filter(Goal.board_id == board_id).order_by(Goal.sort_order).all()
    result = []
    for g in goals:
        total = db.query(func.count(Task.id)).filter(Task.goal_id == g.id).scalar() or 0
        completed = db.query(func.count(Task.id)).filter(
            Task.goal_id == g.id,
            Task.completed_at.isnot(None),
        ).scalar() or 0
        pct = (completed / total * 100) if total else 0.0
        result.append(
            ProgressGoalResponse(
                id=g.id,
                board_id=g.board_id,
                title=g.title,
                description=g.description,
                target_date=g.target_date,
                sort_order=g.sort_order,
                percent_complete=round(pct, 1),
                completed_tasks=completed,
                total_tasks=total,
            )
        )
    return ProgressBoardResponse(board_id=board_id, goals=result)


@router.get("/confidence", response_model=ProgressConfidenceResponse)
def progress_confidence(
    board_id: str | None = None,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Progress confidence: NOT raw completion. Combines task completion, consistency,
    alignment (from AI), and agent confidence. Returns transparent breakdown.
    """
    boards = db.query(VisionBoard).filter(VisionBoard.user_id == user_id).all()
    if not boards:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No board found")
    board = next((b for b in boards if b.id == board_id), boards[0])
    goals = db.query(Goal).filter(Goal.board_id == board.id).order_by(Goal.sort_order).all()
    tasks = db.query(Task).filter(Task.user_id == user_id).all()
    journal = (
        db.query(JournalEntry)
        .filter(JournalEntry.user_id == user_id)
        .order_by(JournalEntry.created_at.desc())
        .limit(50)
        .all()
    )
    tasks_completed = [t for t in tasks if t.completed_at]
    task_completed_dates = [t.completed_at for t in tasks_completed if t.completed_at]
    journal_dates = [j.created_at for j in journal if j.created_at]
    goals_data = [{"id": g.id, "title": g.title, "description": g.description or ""} for g in goals]
    tasks_data = [
        {"id": t.id, "title": t.title, "goal_id": t.goal_id, "completed_at": t.completed_at.isoformat() if t.completed_at else None}
        for t in tasks[:30]
    ]
    journal_snippets = [j.content for j in journal[:10]]
    alignment_result = run_alignment(goals_data, tasks_data, journal_snippets)
    alignment_score = alignment_result.get("score", 0)
    has_goals = len(goals) > 0
    has_incomplete = any(t.completed_at is None for t in tasks)
    out = compute_confidence(
        tasks_total=len(tasks),
        tasks_completed=len(tasks_completed),
        task_completed_dates=task_completed_dates,
        journal_dates=journal_dates,
        alignment_score=alignment_score,
        has_goals=has_goals,
        has_incomplete_tasks=has_incomplete,
    )
    return ProgressConfidenceResponse(
        confidence_score=out["confidence_score"],
        breakdown=ProgressConfidenceBreakdown(**out["breakdown"]),
        explanation=out["explanation"],
    )
