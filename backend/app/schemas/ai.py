from pydantic import BaseModel


class AlignmentResponse(BaseModel):
    score: int
    explanation: str


class GoalPair(BaseModel):
    goal_ids: list[str]
    reason: str


class SynergyResponse(BaseModel):
    pairs: list[GoalPair]
    compound_actions: list[str]
    explanation: str


class OptimizationResponse(BaseModel):
    action: str
    reason: str
    goal_id: str | None


class InsightsResponse(BaseModel):
    alignment: AlignmentResponse
    synergy: SynergyResponse
    optimization: OptimizationResponse
    trace_id: str | None = None  # Opik trace id for linking feedback to this insights run


class FeedbackCreate(BaseModel):
    rating: str  # yes, no, somewhat
    trace_id: str | None = None  # When set, log feedback to this Opik trace


class FeedbackResponse(BaseModel):
    ok: bool
