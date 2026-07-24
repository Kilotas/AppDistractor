from fastapi import Depends

from app.core.database import AsyncSessionFactory
from app.services.blocked_event import BlockedEventService
from app.services.insights import InsightService
from app.services.session import SessionService
from app.services.task import TaskService
from app.services.whitelist import WhitelistService
from app.unit_of_work.sqlalchemy import SQLAlchemyUoW


def get_uow() -> SQLAlchemyUoW:
    return SQLAlchemyUoW(AsyncSessionFactory)


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
