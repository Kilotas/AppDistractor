from datetime import datetime, timezone

from app.domain.models import Session, SessionStatus
from app.domain.schemas.session import SessionStart
from app.exceptions import NotFoundError, ConflictError
from app.unit_of_work.protocol import UoWProtocol


class SessionService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def start(self, data: SessionStart) -> Session:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(data.task_id)
            if task is None:
                raise NotFoundError("Task", data.task_id)

            existing = await self._uow.sessions.get_active_for_task(data.task_id)
            if existing is not None:
                raise ConflictError(
                    f"Task {data.task_id} already has an active session (id={existing.id})"
                )

            session = Session(
                task_id=data.task_id,
                started_at=datetime.now(timezone.utc),
                status=SessionStatus.ACTIVE,
            )
            await self._uow.sessions.add(session)
            await self._uow.commit()
            return session

    async def stop(self, session_id: int) -> Session:
        async with self._uow:
            session = await self._uow.sessions.get_by_id(session_id)
            if session is None:
                raise NotFoundError("Session", session_id)
            if session.status != SessionStatus.ACTIVE:
                raise ConflictError(f"Session {session_id} is not active")

            now = datetime.now(timezone.utc)
            session.ended_at = now
            session.status = SessionStatus.COMPLETED
            session.focus_score = self._calc_focus_score(session)
            await self._uow.commit()
            return session

    async def get(self, session_id: int) -> Session:
        async with self._uow:
            session = await self._uow.sessions.get_by_id(session_id)
            if session is None:
                raise NotFoundError("Session", session_id)
            return session

    async def list_for_task(self, task_id: int) -> list[Session]:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)
            return await self._uow.sessions.get_by_task_id(task_id)

    @staticmethod
    def _calc_focus_score(session: Session) -> float:
        """
        Простая эвристика: 100 баллов минус штраф за отвлечения.
        Каждые 5 попыток = -10 баллов, минимум 0.
        Уточним формулу когда подключим AI-анализ.
        """
        penalty = (session.blocked_attempts // 5) * 10
        return max(0.0, 100.0 - penalty)
