from datetime import date, datetime
from pydantic import BaseModel


class ProgressConfidenceBreakdown(BaseModel):
    task_completion: float
    consistency: float
    alignment: float
    agent_confidence: float


class ProgressConfidenceResponse(BaseModel):
    confidence_score: float
    breakdown: ProgressConfidenceBreakdown
    explanation: str


class ProgressGoalResponse(BaseModel):
    id: str
    board_id: str
    title: str
    description: str
    target_date: date | None
    sort_order: int
    percent_complete: float
    completed_tasks: int
    total_tasks: int


class ProgressBoardResponse(BaseModel):
    board_id: str
    goals: list[ProgressGoalResponse]
