from sqlalchemy import func, case, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models import Task
from app.domain.models.subtask import Subtask
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Task)

    async def get_all_for_user(self, user_id: int) -> list[Task]:
        result = await self._session.execute(
            select(Task).where(Task.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_all_for_user_with_counts(self, user_id: int) -> list[tuple[Task, int, int]]:
        result = await self._session.execute(
            select(
                Task,
                func.count(Subtask.id).label("subtask_count"),
                func.count(case((Subtask.is_completed.is_(True), 1))).label("completed_count"),
            )
            .outerjoin(Subtask, Subtask.task_id == Task.id)
            .where(Task.user_id == user_id)
            .group_by(Task.id)
        )
        return [(row.Task, row.subtask_count, row.completed_count) for row in result]

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

