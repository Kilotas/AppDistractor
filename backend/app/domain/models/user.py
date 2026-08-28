import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domain.models.base import TimestampMixin


class UserPlan(str, enum.Enum):
    FREE = "free"
    PRO = "pro"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    plan: Mapped[UserPlan] = mapped_column(
        Enum(UserPlan, values_callable=lambda x: [e.value for e in x]),
        default=UserPlan.FREE,
        nullable=False,
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_token: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, server_default="false")
    password_reset_token: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    password_reset_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    tasks: Mapped[list["Task"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    password_history: Mapped[list["PasswordHistory"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
    routines: Mapped[list["Routine"]] = relationship(back_populates="user", cascade="all, delete-orphan")  # noqa: F821
