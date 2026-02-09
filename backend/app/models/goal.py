from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import gen_uuid


class Goal(Base):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    board_id = Column(String(36), ForeignKey("vision_boards.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, default="", nullable=False)
    target_date = Column(Date, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    priority = Column(String(100), nullable=True)
    image_uri = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    board = relationship("VisionBoard", back_populates="goals")
    tasks = relationship("Task", back_populates="goal", cascade="all, delete-orphan")
