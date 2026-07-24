from fastapi import APIRouter, Depends, status

from app.api.deps import get_blocked_event_service
from app.domain.schemas.blocked_event import BlockedEventCreate, BlockedEventResponse
from app.services.blocked_event import BlockedEventService

router = APIRouter(prefix="/events", tags=["events"])


@router.post("/", response_model=BlockedEventResponse, status_code=status.HTTP_201_CREATED)
async def log_blocked_event(
    data: BlockedEventCreate,
    service: BlockedEventService = Depends(get_blocked_event_service),
):
    return await service.log(data)
