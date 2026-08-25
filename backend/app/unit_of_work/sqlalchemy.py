from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.repositories import (
    UserRepository,
    TaskRepository,
    SessionRepository,
    WhitelistRepository,
    BlockedEventRepository,
    SubtaskRepository,
)


class SQLAlchemyUoW:
    def __init__(self, session_factory: async_sessionmaker[AsyncSession]) -> None:
        self._session_factory = session_factory

    async def __aenter__(self) -> "SQLAlchemyUoW":
        self._session: AsyncSession = self._session_factory()
        self.users = UserRepository(self._session)
        self.tasks = TaskRepository(self._session)
        self.sessions = SessionRepository(self._session)
        self.whitelist = WhitelistRepository(self._session)
        self.blocked_events = BlockedEventRepository(self._session)
        self.subtasks = SubtaskRepository(self._session)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if exc_type is not None:
            await self.rollback()
        await self._session.close()

    async def commit(self) -> None:
        await self._session.commit()

    async def rollback(self) -> None:
        await self._session.rollback()
