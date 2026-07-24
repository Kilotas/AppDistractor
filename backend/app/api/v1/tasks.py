from fastapi import APIRouter, Depends, status

from app.api.deps import get_insight_service, get_task_service
from app.domain.schemas.insights import TaskInsights
from app.domain.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.services.insights import InsightService
from app.services.task import TaskService

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=list[TaskResponse])
async def list_tasks(
    service: TaskService = Depends(get_task_service),
) -> list:
    return await service.list_all()


@router.get("/active", response_model=list[TaskResponse])
async def list_active_tasks(
    service: TaskService = Depends(get_task_service),
) -> list:
    return await service.list_active()


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: TaskCreate,
    service: TaskService = Depends(get_task_service),
):
    return await service.create(data)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
):
    return await service.get(task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    data: TaskUpdate,
    service: TaskService = Depends(get_task_service),
):
    return await service.update(task_id, data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    service: TaskService = Depends(get_task_service),
) -> None:
    await service.delete(task_id)


@router.get("/{task_id}/insights", response_model=TaskInsights)
async def get_task_insights(
    task_id: int,
    service: InsightService = Depends(get_insight_service),
):
    return await service.get_for_task(task_id)
