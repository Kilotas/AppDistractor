from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.domain.models.routine import Routine, RoutineType
from app.repositories.base import BaseRepository


class RoutineRepository(BaseRepository[Routine]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, Routine)

    async def get_all_for_user(self, user_id: int) -> list[Routine]:
        result = await self._session.execute(
            select(Routine).where(Routine.user_id == user_id)
        )
        return list(result.scalars().all())

    async def get_by_type(self, user_id: int, routine_type: RoutineType) -> Routine | None:
        result = await self._session.execute(
            select(Routine).where(
                Routine.user_id == user_id,
                Routine.type == routine_type,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_enabled(self) -> list[Routine]:
        result = await self._session.execute(
            select(Routine)
            .where(Routine.enabled == True)  # noqa: E712
            .options(joinedload(Routine.user))
        )
        return list(result.scalars().unique().all())
