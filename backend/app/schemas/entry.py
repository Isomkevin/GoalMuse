from datetime import datetime
from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    goal_id: str | None = None
    due_date: datetime | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    goal_id: str | None = None
    due_date: datetime | None = None
    completed: bool | None = None


class TaskResponse(BaseModel):
    id: str
    user_id: str
    goal_id: str | None
    title: str
    due_date: datetime | None
    completed_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class JournalCreate(BaseModel):
    content: str = Field(..., min_length=1)
    goal_ids: list[str] = Field(default_factory=list, max_length=50)


class JournalResponse(BaseModel):
    id: str
    user_id: str
    content: str
    goal_ids: list[str]
    created_at: datetime

    class Config:
        from_attributes = True


class JournalListResponse(BaseModel):
    entries: list[JournalResponse]
    total: int
