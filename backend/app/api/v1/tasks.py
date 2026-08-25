from fastapi import APIRouter, Depends, status

from app.api.deps import get_verified_user, get_insight_service, get_task_service
from app.domain.models.user import User
from app.domain.schemas.insights import TaskInsights
from app.domain.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.exceptions import PaymentRequiredError
from app.services.billing import user_has_access
from app.services.insights import InsightService
from app.services.task import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    current_user: User = Depends(get_verified_user),
    service: TaskService = Depends(get_task_service),
):
    return await service.list_all(current_user.id)


@router.get("/active", response_model=list[TaskResponse])
async def list_active_tasks(
    current_user: User = Depends(get_verified_user),
    service: TaskService = Depends(get_task_service),
):
    return await service.list_active(current_user.id)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_verified_user),
    service: TaskService = Depends(get_task_service),
):
    return await service.create(current_user.id, data)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    current_user: User = Depends(get_verified_user),
    service: TaskService = Depends(get_task_service),
):
    return await service.get(current_user.id, task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    current_user: User = Depends(get_verified_user),
    service: TaskService = Depends(get_task_service),
):
    return await service.update(current_user.id, task_id, data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_verified_user),
    service: TaskService = Depends(get_task_service),
) -> None:
    await service.delete(current_user.id, task_id)


@router.get("/{task_id}/insights", response_model=TaskInsights)
async def get_task_insights(
    task_id: int,
    current_user: User = Depends(get_verified_user),
    service: InsightService = Depends(get_insight_service),
):
    if not user_has_access(current_user):
        raise PaymentRequiredError("Для AI-инсайтов нужна подписка Pro или активный триал")
    return await service.get_for_task(task_id)
