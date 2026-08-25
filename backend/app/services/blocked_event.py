import logging
from collections import Counter

from app.domain.models import BlockedEvent
from app.domain.schemas.blocked_event import BlockedEventCreate
from app.domain.schemas.stats import SessionStats
from app.exceptions import ConflictError, NotFoundError
from app.unit_of_work.protocol import UoWProtocol

logger = logging.getLogger(__name__)


class BlockedEventService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def log(self, data: BlockedEventCreate) -> BlockedEvent:
        async with self._uow:
            session = await self._uow.sessions.get_by_id(data.session_id)
            if session is None:
                raise NotFoundError("Session", data.session_id)
            from app.domain.models.session import SessionStatus
            if session.status != SessionStatus.ACTIVE:
                raise ConflictError(f"Session {data.session_id} is not active")

            event = BlockedEvent(
                session_id=data.session_id,
                url=data.url,
                domain=data.domain,
                attempted_at=data.attempted_at,
                session_minute=data.session_minute,
                source=data.source,
            )
            await self._uow.blocked_events.add(event)
            session.blocked_attempts += 1
            await self._uow.commit()
            logger.info("Blocked event logged: session_id=%d domain=%s total_blocked=%d", data.session_id, data.domain, session.blocked_attempts)
            return event

    async def get_for_session(self, session_id: int) -> list[BlockedEvent]:
        async with self._uow:
            session = await self._uow.sessions.get_by_id(session_id)
            if session is None:
                raise NotFoundError("Session", session_id)
            return await self._uow.blocked_events.get_by_session_id(session_id)

    async def get_stats(self, session_id: int) -> SessionStats:
        async with self._uow:
            session = await self._uow.sessions.get_by_id(session_id)
            if session is None:
                raise NotFoundError("Session", session_id)

            events = await self._uow.blocked_events.get_by_session_id(session_id)

            # Длительность сессии в минутах
            if session.ended_at and session.started_at:
                delta = session.ended_at - session.started_at
                duration_minutes = int(delta.total_seconds() // 60)
            else:
                duration_minutes = None

            # Блокировки по минутам — пропускаем события без session_minute
            blocked_per_minute: dict[int, int] = {}
            for event in events:
                if event.session_minute is not None:
                    minute = event.session_minute
                    blocked_per_minute[minute] = blocked_per_minute.get(minute, 0) + 1

            # Топ доменов
            domain_counts = Counter(e.domain for e in events)
            top_domains = [
                {"domain": domain, "count": count}
                for domain, count in domain_counts.most_common(10)
            ]

            return SessionStats(
                session_id=session_id,
                duration_minutes=duration_minutes,
                total_blocked=len(events),
                blocked_per_minute=blocked_per_minute,
                top_domains=top_domains,
            )
