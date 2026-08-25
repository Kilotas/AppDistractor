import logging

from app.domain.models.subtask import Subtask
from app.domain.schemas.subtask import SubtaskCreate, SubtaskUpdate
from app.exceptions import NotFoundError
from app.unit_of_work.protocol import UoWProtocol

logger = logging.getLogger(__name__)


class SubtaskService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def _get_task_or_404(self, uow: UoWProtocol, task_id: int, user_id: int) -> None:
        task = await uow.tasks.get_by_id_for_user(task_id, user_id)
        if task is None:
            raise NotFoundError("Task", task_id)

    async def list_for_task(self, user_id: int, task_id: int) -> list[Subtask]:
        async with self._uow as uow:
            await self._get_task_or_404(uow, task_id, user_id)
            return await uow.subtasks.get_all_for_task(task_id)

    async def create(self, user_id: int, task_id: int, data: SubtaskCreate) -> Subtask:
        async with self._uow as uow:
            await self._get_task_or_404(uow, task_id, user_id)
            position = await uow.subtasks.next_position(task_id)
            subtask = Subtask(task_id=task_id, title=data.title, position=position)
            await uow.subtasks.add(subtask)
            await uow.commit()
            logger.info("Subtask created: id=%d task_id=%d title=%r", subtask.id, task_id, subtask.title)
            return subtask

    async def update(self, user_id: int, task_id: int, subtask_id: int, data: SubtaskUpdate) -> Subtask:
        async with self._uow as uow:
            await self._get_task_or_404(uow, task_id, user_id)
            subtask = await uow.subtasks.get_by_id_for_task(subtask_id, task_id)
            if subtask is None:
                raise NotFoundError("Subtask", subtask_id)
            changes = data.model_dump(exclude_unset=True)
            for field, value in changes.items():
                setattr(subtask, field, value)
            await uow.commit()
            logger.info("Subtask updated: id=%d changes=%s", subtask_id, list(changes.keys()))
            return subtask

    async def delete(self, user_id: int, task_id: int, subtask_id: int) -> None:
        async with self._uow as uow:
            await self._get_task_or_404(uow, task_id, user_id)
            subtask = await uow.subtasks.get_by_id_for_task(subtask_id, task_id)
            if subtask is None:
                raise NotFoundError("Subtask", subtask_id)
            await uow.subtasks.delete(subtask)
            await uow.commit()
            logger.info("Subtask deleted: id=%d task_id=%d", subtask_id, task_id)
