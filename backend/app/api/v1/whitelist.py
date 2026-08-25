from fastapi import APIRouter, Depends, status

from app.api.deps import get_verified_user, get_task_service, get_whitelist_service
from app.domain.models.user import User
from app.domain.schemas.whitelist import WhitelistEntryCreate, WhitelistEntryResponse
from app.exceptions import NotFoundError
from app.services.task import TaskService
from app.services.whitelist import WhitelistService

router = APIRouter(tags=["whitelist"])


async def verify_task_owner(
    task_id: int,
    current_user: User = Depends(get_verified_user),
    task_service: TaskService = Depends(get_task_service),
) -> None:
    await task_service.get(current_user.id, task_id)


@router.get("/tasks/{task_id}/whitelist", response_model=list[WhitelistEntryResponse])
async def get_whitelist(
    task_id: int,
    _: None = Depends(verify_task_owner),
    service: WhitelistService = Depends(get_whitelist_service),
):
    return await service.get_for_task(task_id)


@router.post(
    "/tasks/{task_id}/whitelist",
    response_model=WhitelistEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_whitelist_entry(
    task_id: int,
    data: WhitelistEntryCreate,
    _: None = Depends(verify_task_owner),
    service: WhitelistService = Depends(get_whitelist_service),
):
    return await service.add_entry(task_id, data)


@router.put("/tasks/{task_id}/whitelist", response_model=list[WhitelistEntryResponse])
async def replace_whitelist(
    task_id: int,
    entries: list[WhitelistEntryCreate],
    _: None = Depends(verify_task_owner),
    service: WhitelistService = Depends(get_whitelist_service),
):
    return await service.replace_for_task(task_id, entries)


@router.delete("/whitelist/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_whitelist_entry(
    entry_id: int,
    current_user: User = Depends(get_verified_user),
    service: WhitelistService = Depends(get_whitelist_service),
) -> None:
    await service.delete_entry(entry_id)
