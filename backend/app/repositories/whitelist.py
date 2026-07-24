from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import WhitelistEntry
from app.repositories.base import BaseRepository


class WhitelistRepository(BaseRepository[WhitelistEntry]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, WhitelistEntry)

    async def get_by_task_id(self, task_id: int) -> list[WhitelistEntry]:
        result = await self._session.execute(
            select(WhitelistEntry).where(WhitelistEntry.task_id == task_id)
        )
        return list(result.scalars().all())

    async def delete_by_task_id(self, task_id: int) -> None:
        await self._session.execute(
            delete(WhitelistEntry).where(WhitelistEntry.task_id == task_id)
        )
        await self._session.flush()
