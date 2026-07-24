from app.domain.models import Task
from app.domain.schemas.task import TaskCreate, TaskUpdate
from app.exceptions import NotFoundError
from app.unit_of_work.protocol import UoWProtocol


class TaskService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def create(self, data: TaskCreate) -> Task:
        async with self._uow:
            task = Task(title=data.title, description=data.description)
            await self._uow.tasks.add(task)
            await self._uow.commit()
            return task

    async def get(self, task_id: int) -> Task:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            return task

    async def list_all(self) -> list[Task]:
        async with self._uow:
            return await self._uow.tasks.get_all()

    async def list_active(self) -> list[Task]:
        async with self._uow:
            return await self._uow.tasks.get_active()

    async def update(self, task_id: int, data: TaskUpdate) -> Task:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            for field, value in data.model_dump(exclude_unset=True).items():
                setattr(task, field, value)
            await self._uow.commit()
            return task

    async def delete(self, task_id: int) -> None:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            await self._uow.tasks.delete(task)
            await self._uow.commit()
