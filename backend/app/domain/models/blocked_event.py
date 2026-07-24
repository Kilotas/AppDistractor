from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BlockedEvent(Base):
    """
    Каждая попытка открыть заблокированный сайт.
    Максимум данных — для будущего AI-анализа паттернов отвлечений.
    """

    __tablename__ = "blocked_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id"), nullable=False)

    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    url: Mapped[str] = mapped_column(String(2048), nullable=False)
    domain: Mapped[str] = mapped_column(String(512), nullable=False)

    # Контекст для AI: в какую минуту сессии произошло отвлечение
    session_minute: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Источник события: extension / manual
    source: Mapped[str] = mapped_column(String(32), default="extension", nullable=False)

    session: Mapped["Session"] = relationship(back_populates="events")  # noqa: F821
