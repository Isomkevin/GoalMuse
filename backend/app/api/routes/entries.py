from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import Goal, JournalEntry, Task, VisionBoard
from app.models.journal_entry import journal_entry_goals
from app.schemas.entry import (
    JournalCreate,
    JournalListResponse,
    JournalResponse,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/entries", tags=["entries"])


def _get_task_or_404(db: Session, task_id: str, user_id: str) -> Task:
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return task


def _task_to_response(task: Task) -> TaskResponse:
    return TaskResponse(
        id=task.id,
        user_id=task.user_id,
        goal_id=task.goal_id,
        title=task.title,
        due_date=task.due_date,
        completed_at=task.completed_at,
        created_at=task.created_at,
    )


# ---- Tasks ----
@router.get("/tasks", response_model=list[TaskResponse])
def list_tasks(
    goal_id: str | None = Query(None),
    completed: bool | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    q = db.query(Task).filter(Task.user_id == user_id)
    if goal_id is not None:
        q = q.filter(Task.goal_id == goal_id)
    if completed is not None:
        if completed:
            q = q.filter(Task.completed_at.isnot(None))
        else:
            q = q.filter(Task.completed_at.is_(None))
    tasks = q.order_by(Task.created_at.desc()).all()
    return [_task_to_response(t) for t in tasks]


@router.post("/tasks", response_model=TaskResponse)
def create_task(
    data: TaskCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    task = Task(
        user_id=user_id,
        goal_id=data.goal_id,
        title=data.title,
        due_date=data.due_date,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _task_to_response(task)


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    task = _get_task_or_404(db, task_id, user_id)
    if data.title is not None:
        task.title = data.title
    if data.goal_id is not None:
        task.goal_id = data.goal_id
    if data.due_date is not None:
        task.due_date = data.due_date
    if data.completed is not None:
        from datetime import timezone
        task.completed_at = datetime.now(timezone.utc) if data.completed else None
    db.commit()
    db.refresh(task)
    return _task_to_response(task)


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    task = _get_task_or_404(db, task_id, user_id)
    db.delete(task)
    db.commit()
    return None


# ---- Journal ----
def _journal_to_response(entry: JournalEntry, goal_ids: list[str]) -> JournalResponse:
    return JournalResponse(
        id=entry.id,
        user_id=entry.user_id,
        content=entry.content,
        goal_ids=goal_ids,
        created_at=entry.created_at,
    )


@router.get("/journal", response_model=JournalListResponse)
def list_journal(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    goal_id: str | None = Query(None),
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    q = db.query(JournalEntry).filter(JournalEntry.user_id == user_id)
    if goal_id:
        subq = db.query(JournalEntry.id).join(JournalEntry.goals).filter(Goal.id == goal_id).distinct()
        q = q.filter(JournalEntry.id.in_(subq))
    total = q.count()
    entries = q.order_by(JournalEntry.created_at.desc()).offset(offset).limit(limit).all()
    result = []
    for e in entries:
        goal_ids = [g.id for g in e.goals]
        result.append(_journal_to_response(e, goal_ids))
    return JournalListResponse(entries=result, total=total)


@router.post("/journal", response_model=JournalResponse)
def create_journal(
    data: JournalCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    entry = JournalEntry(user_id=user_id, content=data.content)
    db.add(entry)
    db.flush()
    if data.goal_ids:
        for gid in data.goal_ids:
            db.execute(journal_entry_goals.insert().values(journal_entry_id=entry.id, goal_id=gid))
    db.commit()
    db.refresh(entry)
    entry = db.query(JournalEntry).filter(JournalEntry.id == entry.id).first()
    goal_ids = [g.id for g in entry.goals]
    return _journal_to_response(entry, goal_ids)
