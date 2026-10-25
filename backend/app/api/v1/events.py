from fastapi import APIRouter, Depends, status

from app.api.deps import get_blocked_event_service, get_session_service, get_verified_user
from app.domain.models.user import User
from app.domain.schemas.blocked_event import BlockedEventCreate, BlockedEventResponse
from app.services.blocked_event import BlockedEventService
from app.services.session import SessionService

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/", response_model=BlockedEventResponse, status_code=status.HTTP_201_CREATED)
async def log_blocked_event(
    data: BlockedEventCreate,
    current_user: User = Depends(get_verified_user),
    session_service: SessionService = Depends(get_session_service),
    service: BlockedEventService = Depends(get_blocked_event_service),
):
    # Проверяем что сессия принадлежит текущему пользователю
    await session_service.get(current_user.id, data.session_id)
    return await service.log(data)
