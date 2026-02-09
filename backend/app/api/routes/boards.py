from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_current_user, get_current_user_id
from app.database import get_db
from app.models import User, VisionBoard, Goal
from app.schemas.board import BoardCreate, BoardResponse, BoardUpdate, BoardWithGoalsResponse
from app.schemas.goal import GoalResponse

router = APIRouter(prefix="/boards", tags=["boards"])


@router.get("", response_model=list[BoardResponse])
def list_boards(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    boards = db.query(VisionBoard).filter(VisionBoard.user_id == user_id).all()
    result = []
    for b in boards:
        goal_count = db.query(func.count(Goal.id)).filter(Goal.board_id == b.id).scalar() or 0
        result.append(BoardResponse.model_validate(b).model_copy(update={"goal_count": goal_count}))
    return result


@router.post("", response_model=BoardResponse)
def create_board(
    data: BoardCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    board = VisionBoard(user_id=user_id, title=data.title)
    db.add(board)
    db.commit()
    db.refresh(board)
    return BoardResponse.model_validate(board).model_copy(update={"goal_count": 0})


def _get_board_or_404(db: Session, board_id: str, user_id: str) -> VisionBoard:
    board = db.query(VisionBoard).filter(
        VisionBoard.id == board_id,
        VisionBoard.user_id == user_id,
    ).first()
    if not board:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Board not found")
    return board


@router.get("/{board_id}", response_model=BoardWithGoalsResponse)
def get_board(
    board_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    board = _get_board_or_404(db, board_id, user_id)
    goal_count = db.query(func.count(Goal.id)).filter(Goal.board_id == board_id).scalar() or 0
    goals = db.query(Goal).filter(Goal.board_id == board_id).order_by(Goal.sort_order).all()
    return BoardWithGoalsResponse(
        board=BoardResponse.model_validate(board).model_copy(update={"goal_count": goal_count}),
        goals=[GoalResponse.model_validate(g) for g in goals],
    )


@router.patch("/{board_id}", response_model=BoardResponse)
def update_board(
    board_id: str,
    data: BoardUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    board = _get_board_or_404(db, board_id, user_id)
    if data.title is not None:
        board.title = data.title
    if data.cover_image_uri is not None:
        board.cover_image_uri = data.cover_image_uri.strip() or None
    db.commit()
    db.refresh(board)
    goal_count = db.query(func.count(Goal.id)).filter(Goal.board_id == board_id).scalar() or 0
    return BoardResponse.model_validate(board).model_copy(update={"goal_count": goal_count})


@router.delete("/{board_id}", status_code=204)
def delete_board(
    board_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    board = _get_board_or_404(db, board_id, user_id)
    db.delete(board)
    db.commit()
    return None
