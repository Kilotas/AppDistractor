from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(session, User)

    async def get_by_email(self, email: str) -> User | None:
        result = await self._session.execute(
            select(User).where(func.lower(User.email) == email.lower())
        )
        return result.scalars().first()

    async def get_by_verification_token(self, token: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.verification_token == token)
        )
        return result.scalars().first()

    async def get_by_reset_token(self, token: str) -> User | None:
        result = await self._session.execute(
            select(User).where(User.password_reset_token == token)
        )
        return result.scalars().first()
