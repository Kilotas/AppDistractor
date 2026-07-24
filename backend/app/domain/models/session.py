import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.models.base import TimestampMixin


class SessionStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Session(Base, TimestampMixin):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("tasks.id"), nullable=False)

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    ended_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[SessionStatus] = mapped_column(
        Enum(SessionStatus), default=SessionStatus.ACTIVE, nullable=False
    )

    # Метрики для AI-анализа
    blocked_attempts: Mapped[int] = mapped_column(default=0, nullable=False)
    focus_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    task: Mapped["Task"] = relationship(back_populates="sessions")  # noqa: F821
    events: Mapped[list["BlockedEvent"]] = relationship(  # noqa: F821
        back_populates="session",
        cascade="all, delete-orphan",
    )
