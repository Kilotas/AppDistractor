from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Task)

    async def get_all_for_user(self, user_id: int) -> list[Task]:
        result = await self._session.execute(
            select(Task).where(Task.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_active_for_user(self, user_id: int) -> list[Task]:
        result = await self._session.execute(
            select(Task).where(Task.user_id == user_id, Task.is_active.is_(True))
        )
        return list(result.scalars().all())

    async def get_by_id_for_user(self, task_id: int, user_id: int) -> Task | None:
        result = await self._session.execute(
            select(Task).where(Task.id == task_id, Task.user_id == user_id)
        )
        return result.scalars().first()
