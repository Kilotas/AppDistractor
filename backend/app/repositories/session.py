from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Session, SessionStatus
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
