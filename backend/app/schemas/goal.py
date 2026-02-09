from datetime import date, datetime
from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field("", max_length=5000)
    target_date: date | None = None
    sort_order: int = 0
    completed: bool = False
    priority: str | None = Field(None, max_length=100)
    image_uri: str | None = Field(None, max_length=500)


class GoalUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    target_date: date | None = None
    sort_order: int | None = None
    completed: bool | None = None
    priority: str | None = Field(None, max_length=100)
    image_uri: str | None = Field(None, max_length=500)


class GoalResponse(BaseModel):
    id: str
    board_id: str
    title: str
    description: str
    target_date: date | None
    sort_order: int
    completed: bool = False
    priority: str | None = None
    image_uri: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
