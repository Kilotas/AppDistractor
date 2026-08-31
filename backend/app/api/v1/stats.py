from fastapi import APIRouter, Depends, Query

from app.api.deps import get_verified_user, get_uow
from app.domain.models.user import User
from app.domain.schemas.stats import DailyStats, StreakStats, TasksStats, FocusScoreHistory
from app.services.stats import StatsService
from app.unit_of_work.sqlalchemy import SQLAlchemyUoW

router = APIRouter(prefix="/stats", tags=["stats"])


def get_stats_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> StatsService:
    return StatsService(uow)


@router.get("/streak", response_model=StreakStats)
async def get_streak(
    current_user: User = Depends(get_verified_user),
    service: StatsService = Depends(get_stats_service),
) -> StreakStats:
    return await service.get_streak(current_user.id)


@router.get("/focus-score", response_model=FocusScoreHistory)
async def get_focus_score_history(
    current_user: User = Depends(get_verified_user),
    service: StatsService = Depends(get_stats_service),
) -> FocusScoreHistory:
    return await service.get_focus_score_history(current_user.id)


@router.get("/tasks", response_model=TasksStats)
async def get_tasks_stats(
    current_user: User = Depends(get_verified_user),
    service: StatsService = Depends(get_stats_service),
) -> TasksStats:
    return await service.get_top_tasks(current_user.id)


@router.get("/daily", response_model=DailyStats)
async def get_daily(
    current_user: User = Depends(get_verified_user),
    service: StatsService = Depends(get_stats_service),
    days: int = Query(default=30, ge=1, le=365),
) -> DailyStats:
    return await service.get_daily(current_user.id, days)
