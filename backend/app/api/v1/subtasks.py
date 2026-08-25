from fastapi import APIRouter, Depends, status

from app.api.deps import get_subtask_service, get_verified_user
from app.domain.models.user import User
from app.domain.schemas.subtask import SubtaskCreate, SubtaskResponse, SubtaskUpdate
from app.services.subtask import SubtaskService

router = APIRouter(tags=["subtasks"])


@router.get("/tasks/{task_id}/subtasks", response_model=list[SubtaskResponse])
async def list_subtasks(
    task_id: int,
    current_user: User = Depends(get_verified_user),
    service: SubtaskService = Depends(get_subtask_service),
):
    return await service.list_for_task(current_user.id, task_id)


@router.post(
    "/tasks/{task_id}/subtasks",
    response_model=SubtaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_subtask(
    task_id: int,
    data: SubtaskCreate,
    current_user: User = Depends(get_verified_user),
    service: SubtaskService = Depends(get_subtask_service),
):
    return await service.create(current_user.id, task_id, data)


@router.patch("/tasks/{task_id}/subtasks/{subtask_id}", response_model=SubtaskResponse)
async def update_subtask(
    task_id: int,
    subtask_id: int,
    data: SubtaskUpdate,
    current_user: User = Depends(get_verified_user),
    service: SubtaskService = Depends(get_subtask_service),
):
    return await service.update(current_user.id, task_id, subtask_id, data)


@router.delete("/tasks/{task_id}/subtasks/{subtask_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtask(
    task_id: int,
    subtask_id: int,
    current_user: User = Depends(get_verified_user),
    service: SubtaskService = Depends(get_subtask_service),
) -> None:
    await service.delete(current_user.id, task_id, subtask_id)
