from sqlalchemy import Column, DateTime, ForeignKey, String, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import gen_uuid


class VisionBoard(Base):
    __tablename__ = "vision_boards"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    cover_image_uri = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="boards")
    goals = relationship("Goal", back_populates="board", order_by="Goal.sort_order", cascade="all, delete-orphan")
