from app.domain.models import WhitelistEntry
from app.domain.schemas.whitelist import WhitelistEntryCreate
from app.exceptions import NotFoundError
from app.unit_of_work.protocol import UoWProtocol


class WhitelistService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def get_for_task(self, task_id: int) -> list[WhitelistEntry]:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            return await self._uow.whitelist.get_by_task_id(task_id)

    async def add_entry(self, task_id: int, data: WhitelistEntryCreate) -> WhitelistEntry:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            entry = WhitelistEntry(task_id=task_id, domain=data.domain, label=data.label)
            await self._uow.whitelist.add(entry)
            await self._uow.commit()
            return entry

    async def delete_entry(self, entry_id: int) -> None:
        async with self._uow:
            entry = await self._uow.whitelist.get_by_id(entry_id)
            if entry is None:
                raise NotFoundError("WhitelistEntry", entry_id)
            await self._uow.whitelist.delete(entry)
            await self._uow.commit()

    async def replace_for_task(
        self, task_id: int, entries: list[WhitelistEntryCreate]
    ) -> list[WhitelistEntry]:
        """Полностью заменяет белый список задачи. Удобно для PUT /tasks/{id}/whitelist."""
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            await self._uow.whitelist.delete_by_task_id(task_id)
            new_entries = [
                WhitelistEntry(task_id=task_id, domain=e.domain, label=e.label)
                for e in entries
            ]
            for entry in new_entries:
                await self._uow.whitelist.add(entry)
            await self._uow.commit()
            return new_entries
