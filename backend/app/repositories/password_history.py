from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.password_history import PasswordHistory
from app.repositories.base import BaseRepository


class PasswordHistoryRepository(BaseRepository[PasswordHistory]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, PasswordHistory)

    async def get_last_n(self, user_id: int, n: int) -> list[PasswordHistory]:
        result = await self._session.execute(
            select(PasswordHistory)
            .where(PasswordHistory.user_id == user_id)
            .order_by(PasswordHistory.created_at.desc())
            .limit(n)
        )
        return list(result.scalars().all())

    async def add_for_user(self, user_id: int, hashed_password: str) -> None:
        entry = PasswordHistory(user_id=user_id, hashed_password=hashed_password)
        await self.add(entry)
