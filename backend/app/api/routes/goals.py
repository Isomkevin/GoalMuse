from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.database import get_db
from app.models import Goal, VisionBoard
from app.schemas.goal import GoalCreate, GoalResponse, GoalUpdate

router = APIRouter(tags=["goals"])


def _get_board_or_404(db: Session, board_id: str, user_id: str) -> VisionBoard:
    board = db.query(VisionBoard).filter(
        VisionBoard.id == board_id,
        VisionBoard.user_id == user_id,
    ).first()
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    return board


def _get_goal_or_404(db: Session, goal_id: str, user_id: str) -> Goal:
    goal = db.query(Goal).join(VisionBoard).filter(
        Goal.id == goal_id,
        VisionBoard.user_id == user_id,
    ).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return goal


@router.post("/boards/{board_id}/goals", response_model=GoalResponse)
def create_goal(
    board_id: str,
    data: GoalCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    _get_board_or_404(db, board_id, user_id)
    goal = Goal(
        board_id=board_id,
        title=data.title,
        description=data.description,
        target_date=data.target_date,
        sort_order=data.sort_order,
        completed=data.completed,
        priority=data.priority,
        image_uri=data.image_uri,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.patch("/goals/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    goal = _get_goal_or_404(db, goal_id, user_id)
    if data.title is not None:
        goal.title = data.title
    if data.description is not None:
        goal.description = data.description
    if data.target_date is not None:
        goal.target_date = data.target_date
    if data.sort_order is not None:
        goal.sort_order = data.sort_order
    if data.completed is not None:
        goal.completed = data.completed
    if data.priority is not None:
        goal.priority = data.priority.strip() or None
    if data.image_uri is not None:
        goal.image_uri = data.image_uri.strip() or None
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/goals/{goal_id}", status_code=204)
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    goal = _get_goal_or_404(db, goal_id, user_id)
    db.delete(goal)
    db.commit()
    return None
