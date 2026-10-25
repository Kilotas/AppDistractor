from datetime import datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import BlockedEvent, Session, Task
from app.repositories.base import BaseRepository


class BlockedEventRepository(BaseRepository[BlockedEvent]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, BlockedEvent)

    async def get_by_session_id(self, session_id: int) -> list[BlockedEvent]:
        result = await self._session.execute(
            select(BlockedEvent)
            .where(BlockedEvent.session_id == session_id)
            .order_by(BlockedEvent.attempted_at)
        )
        return list(result.scalars().all())

    async def get_for_user_since(
        self, user_id: int, since: datetime
    ) -> list[tuple[str, datetime, int | None]]:
        """Возвращает (domain, attempted_at, session_minute) всех попыток пользователя начиная с since."""
        result = await self._session.execute(
            select(BlockedEvent.domain, BlockedEvent.attempted_at, BlockedEvent.session_minute)
            .join(Session, Session.id == BlockedEvent.session_id)
            .join(Task, Task.id == Session.task_id)
            .where(Task.user_id == user_id, BlockedEvent.attempted_at >= since)
        )
        return [(row.domain, row.attempted_at, row.session_minute) for row in result]

    async def get_top_domains_for_task(self, task_id: int, limit: int = 5) -> list[tuple[str, int]]:
        """Возвращает (domain, count) самых частых попыток по всем сессиям задачи."""
        count = func.count(BlockedEvent.id).label("count")
        result = await self._session.execute(
            select(BlockedEvent.domain, count)
            .join(Session, Session.id == BlockedEvent.session_id)
            .where(Session.task_id == task_id)
            .group_by(BlockedEvent.domain)
            .order_by(count.desc(), BlockedEvent.domain)
            .limit(limit)
        )
        return [(row.domain, row.count) for row in result]

    async def get_session_minutes_for_task(self, task_id: int) -> list[int]:
        """Возвращает session_minute всех попыток по сессиям задачи (без пустых)."""
        result = await self._session.execute(
            select(BlockedEvent.session_minute)
            .join(Session, Session.id == BlockedEvent.session_id)
            .where(Session.task_id == task_id, BlockedEvent.session_minute.is_not(None))
        )
        return list(result.scalars().all())
