from typing import Protocol, Self

from app.repositories.protocols import (
    TaskRepositoryProtocol,
    SessionRepositoryProtocol,
    WhitelistRepositoryProtocol,
    BlockedEventRepositoryProtocol,
)


class UoWProtocol(Protocol):
    tasks: TaskRepositoryProtocol
    sessions: SessionRepositoryProtocol
    whitelist: WhitelistRepositoryProtocol
    blocked_events: BlockedEventRepositoryProtocol

    async def __aenter__(self) -> Self: ...
    async def __aexit__(self, *args: object) -> None: ...
    async def commit(self) -> None: ...
    async def rollback(self) -> None: ...
