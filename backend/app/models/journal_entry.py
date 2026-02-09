from sqlalchemy import Column, DateTime, ForeignKey, String, Table, Text, func
from sqlalchemy.orm import relationship

from app.database import Base
from app.models.user import gen_uuid

# Many-to-many: journal entry <-> goals
journal_entry_goals = Table(
    "journal_entry_goals",
    Base.metadata,
    Column("journal_entry_id", String(36), ForeignKey("journal_entries.id", ondelete="CASCADE"), primary_key=True),
    Column("goal_id", String(36), ForeignKey("goals.id", ondelete="CASCADE"), primary_key=True),
)


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="journal_entries")
    goals = relationship("Goal", secondary=journal_entry_goals, backref="journal_entries")


class JournalEntryGoal:
    """Placeholder for type hints; actual mapping via Table above."""

    pass
