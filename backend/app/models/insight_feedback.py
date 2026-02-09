from sqlalchemy import Column, DateTime, ForeignKey, String, func
from app.database import Base
from app.models.user import gen_uuid


class InsightFeedback(Base):
    """User feedback on AI insights: Did this help? (yes / no / somewhat)."""
    __tablename__ = "insight_feedback"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(String(20), nullable=False)  # yes, no, somewhat
    created_at = Column(DateTime(timezone=True), server_default=func.now())
