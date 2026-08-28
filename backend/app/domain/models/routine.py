import enum

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RoutineType(str, enum.Enum):
    MORNING_BRIEF = "morning_brief"
    END_OF_DAY = "end_of_day"
    WEEKLY_SUMMARY = "weekly_summary"


class Routine(Base):
    __tablename__ = "routines"
    __table_args__ = (
        UniqueConstraint("user_id", "type", name="uq_routine_user_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type: Mapped[RoutineType] = mapped_column(
        Enum(RoutineType, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
    )
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # час отправки в локальном времени пользователя (0-23)
    hour: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    # смещение от UTC в часах (например 3 = UTC+3)
    timezone_offset: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    # день недели для weekly_summary (0=Пн, 6=Вс)
    weekday: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    user: Mapped["User"] = relationship(back_populates="routines")  # noqa: F821
