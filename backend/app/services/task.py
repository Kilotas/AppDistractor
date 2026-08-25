import logging

from app.domain.models import Task
from app.domain.schemas.task import TaskCreate, TaskUpdate
from app.exceptions import NotFoundError
from app.unit_of_work.protocol import UoWProtocol

logger = logging.getLogger(__name__)


class TaskService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def create(self, user_id: int, data: TaskCreate) -> Task:
        async with self._uow:
            task = Task(user_id=user_id, title=data.title, description=data.description)
            await self._uow.tasks.add(task)
            await self._uow.commit()
            logger.info("Task created: id=%d user_id=%d title=%r", task.id, user_id, task.title)
            return task

    async def get(self, user_id: int, task_id: int) -> Task:
        async with self._uow:
            task = await self._uow.tasks.get_by_id_for_user(task_id, user_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            return task

    async def list_all(self, user_id: int) -> list[Task]:
        async with self._uow:
            return await self._uow.tasks.get_all_for_user(user_id)

    async def list_active(self, user_id: int) -> list[Task]:
        async with self._uow:
            return await self._uow.tasks.get_active_for_user(user_id)

    async def update(self, user_id: int, task_id: int, data: TaskUpdate) -> Task:
        async with self._uow:
            task = await self._uow.tasks.get_by_id_for_user(task_id, user_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            changes = data.model_dump(exclude_unset=True)
            for field, value in changes.items():
                setattr(task, field, value)
            await self._uow.commit()
            logger.info("Task updated: id=%d user_id=%d changes=%s", task_id, user_id, list(changes.keys()))
            return task

    async def delete(self, user_id: int, task_id: int) -> None:
        async with self._uow:
            task = await self._uow.tasks.get_by_id_for_user(task_id, user_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            await self._uow.tasks.delete(task)
            await self._uow.commit()
            logger.info("Task deleted: id=%d user_id=%d", task_id, user_id)
