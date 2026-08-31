from fastapi import APIRouter, Depends, status

from app.api.deps import get_blocked_event_service, get_verified_user, get_session_service, get_task_service
from app.domain.models.user import User
from app.domain.schemas.blocked_event import BlockedEventResponse
from app.domain.schemas.session import SessionResponse, SessionStart
from app.domain.schemas.stats import SessionStats
from app.services.blocked_event import BlockedEventService
from app.services.session import SessionService
from app.services.task import TaskService

router = APIRouter(tags=["sessions"])


@router.post("/sessions/start", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    data: SessionStart,
    current_user: User = Depends(get_verified_user),
    task_service: TaskService = Depends(get_task_service),
    session_service: SessionService = Depends(get_session_service),
):
    # Проверяем что задача принадлежит текущему пользователю
    await task_service.get(current_user.id, data.task_id)
    return await session_service.start(data)


@router.post("/sessions/{session_id}/stop", response_model=SessionResponse)
async def stop_session(
    session_id: int,
    current_user: User = Depends(get_verified_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.stop(session_id)


@router.get("/sessions/active", response_model=list[SessionResponse])
async def get_active_sessions(
    current_user: User = Depends(get_verified_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get_active_for_user(current_user.id)


@router.get("/sessions/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: int,
    current_user: User = Depends(get_verified_user),
    service: SessionService = Depends(get_session_service),
):
    return await service.get(session_id)


@router.get("/tasks/{task_id}/sessions", response_model=list[SessionResponse])
async def list_sessions_for_task(
    task_id: int,
    current_user: User = Depends(get_verified_user),
    task_service: TaskService = Depends(get_task_service),
    session_service: SessionService = Depends(get_session_service),
):
    await task_service.get(current_user.id, task_id)
    return await session_service.list_for_task(task_id)


@router.get("/sessions/{session_id}/events", response_model=list[BlockedEventResponse])
async def list_events_for_session(
    session_id: int,
    current_user: User = Depends(get_verified_user),
    service: BlockedEventService = Depends(get_blocked_event_service),
):
    return await service.get_for_session(session_id)


@router.get("/sessions/{session_id}/stats", response_model=SessionStats)
async def get_session_stats(
    session_id: int,
    current_user: User = Depends(get_verified_user),
    service: BlockedEventService = Depends(get_blocked_event_service),
):
    return await service.get_stats(session_id)
