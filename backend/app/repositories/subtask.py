from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.subtask import Subtask
from app.repositories.base import BaseRepository


class SubtaskRepository(BaseRepository[Subtask]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Subtask)

    async def get_all_for_task(self, task_id: int) -> list[Subtask]:
        result = await self._session.execute(
            select(Subtask)
            .where(Subtask.task_id == task_id)
            .order_by(Subtask.position)
        )
        return list(result.scalars().all())

    async def get_by_id_for_task(self, subtask_id: int, task_id: int) -> Subtask | None:
        result = await self._session.execute(
            select(Subtask).where(Subtask.id == subtask_id, Subtask.task_id == task_id)
        )
        return result.scalars().first()

    async def next_position(self, task_id: int) -> int:
        result = await self._session.execute(
            select(func.max(Subtask.position)).where(Subtask.task_id == task_id)
        )
        max_pos = result.scalar()
        return (max_pos or 0) + 1
