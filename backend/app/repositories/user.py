from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.models.blocked_event import BlockedEvent
from app.domain.models.password_history import PasswordHistory
from app.domain.models.routine import Routine
from app.domain.models.session import Session
from app.domain.models.subtask import Subtask
from app.domain.models.task import Task
from app.domain.models.user import User
from app.domain.models.whitelist import WhitelistEntry
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

    async def delete_with_data(self, user_id: int) -> None:
        """Удаляет пользователя и все его данные.

        У tasks/sessions/whitelist/blocked_events в БД нет ON DELETE CASCADE,
        поэтому удаляем явно, от листьев к корню.
        """
        task_ids = select(Task.id).where(Task.user_id == user_id)
        session_ids = select(Session.id).where(Session.task_id.in_(task_ids))

        for stmt in (
            delete(BlockedEvent).where(BlockedEvent.session_id.in_(session_ids)),
            delete(Session).where(Session.task_id.in_(task_ids)),
            delete(WhitelistEntry).where(WhitelistEntry.task_id.in_(task_ids)),
            delete(Subtask).where(Subtask.task_id.in_(task_ids)),
            delete(Task).where(Task.user_id == user_id),
            delete(Routine).where(Routine.user_id == user_id),
            delete(PasswordHistory).where(PasswordHistory.user_id == user_id),
            delete(User).where(User.id == user_id),
        ):
            await self._session.execute(stmt, execution_options={"synchronize_session": False})
        self._session.expunge_all()
