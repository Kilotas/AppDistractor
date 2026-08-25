from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.models.base import TimestampMixin


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    user: Mapped["User"] = relationship(back_populates="tasks")  # noqa: F821

    sessions: Mapped[list["Session"]] = relationship(  # noqa: F821
        back_populates="task",
        cascade="all, delete-orphan",
    )
    whitelist_entries: Mapped[list["WhitelistEntry"]] = relationship(  # noqa: F821
        back_populates="task",
        cascade="all, delete-orphan",
    )
    subtasks: Mapped[list["Subtask"]] = relationship(  # noqa: F821
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="Subtask.position",
    )
