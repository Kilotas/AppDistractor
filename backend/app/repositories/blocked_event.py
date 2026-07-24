from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import BlockedEvent
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
