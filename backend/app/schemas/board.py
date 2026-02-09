from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.goal import GoalResponse


class BoardCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class BoardUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)


class BoardResponse(BaseModel):
    id: str
    user_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    goal_count: int | None = None

    class Config:
        from_attributes = True


class BoardWithGoalsResponse(BaseModel):
    board: BoardResponse
    goals: list[GoalResponse]
