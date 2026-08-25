from datetime import date

from sqlalchemy import cast, select, Date, distinct, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Session, SessionStatus, Task
from app.repositories.base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Session)

    async def get_by_task_id(self, task_id: int) -> list[Session]:
        result = await self._session.execute(
            select(Session).where(Session.task_id == task_id)
        )
        return list(result.scalars().all())

    async def get_active_for_task(self, task_id: int) -> Session | None:
        result = await self._session.execute(
            select(Session).where(
                Session.task_id == task_id,
                Session.status == SessionStatus.ACTIVE,
            )
        )
        return result.scalars().first()

    async def get_completed_dates_for_user(self, user_id: int) -> list[date]:
        """Возвращает список уникальных дат (UTC), когда у пользователя была хотя бы одна завершённая сессия."""
        result = await self._session.execute(
            select(distinct(cast(Session.ended_at, Date)))
            .join(Task, Task.id == Session.task_id)
            .where(
                Task.user_id == user_id,
                Session.status == SessionStatus.COMPLETED,
                Session.ended_at.is_not(None),
            )
        )
        return list(result.scalars().all())

    async def get_daily_stats_for_user(
        self, user_id: int, since: date
    ) -> list[tuple[date, int, int]]:
        """Возвращает (date, focus_minutes, sessions_count) за каждый день начиная с since."""
        day_col = cast(Session.ended_at, Date).label("day")
        result = await self._session.execute(
            select(
                day_col,
                func.sum(
                    func.extract("epoch", Session.ended_at - Session.started_at) / 60
                ).label("focus_minutes"),
                func.count(Session.id).label("sessions_count"),
            )
            .join(Task, Task.id == Session.task_id)
            .where(
                Task.user_id == user_id,
                Session.status == SessionStatus.COMPLETED,
                Session.ended_at.is_not(None),
                cast(Session.ended_at, Date) >= since,
            )
            .group_by(day_col)
            .order_by(day_col)
        )
        return [(row.day, int(row.focus_minutes or 0), row.sessions_count) for row in result]
