from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Task
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Task)

    async def get_active(self) -> list[Task]:
        result = await self._session.execute(
            select(Task).where(Task.is_active.is_(True))
        )
        return list(result.scalars().all())
