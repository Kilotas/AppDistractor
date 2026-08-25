from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import AsyncSessionFactory
from app.domain.models.user import User
from app.exceptions import AuthError, ForbiddenError
from app.services.auth import AuthService, decode_access_token
from app.services.blocked_event import BlockedEventService
from app.services.insights import InsightService
from app.services.session import SessionService
from app.services.subtask import SubtaskService
from app.services.task import TaskService
from app.services.whitelist import WhitelistService
from app.unit_of_work.sqlalchemy import SQLAlchemyUoW

bearer = HTTPBearer()


def get_uow() -> SQLAlchemyUoW:
    return SQLAlchemyUoW(AsyncSessionFactory)


def get_auth_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> AuthService:
    return AuthService(uow)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    uow: SQLAlchemyUoW = Depends(get_uow),
) -> User:
    user_id = decode_access_token(credentials.credentials)
    service = AuthService(uow)
    return await service.get_user(user_id)


async def get_verified_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_verified:
        raise ForbiddenError("Подтвердите email перед использованием приложения")
    return current_user


def get_task_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> TaskService:
    return TaskService(uow)


def get_session_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> SessionService:
    return SessionService(uow)


def get_whitelist_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> WhitelistService:
    return WhitelistService(uow)


def get_blocked_event_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> BlockedEventService:
    return BlockedEventService(uow)


def get_insight_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> InsightService:
    return InsightService(uow)


def get_subtask_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> SubtaskService:
    return SubtaskService(uow)
