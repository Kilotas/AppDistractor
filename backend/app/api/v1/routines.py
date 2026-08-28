from fastapi import APIRouter, Depends

from app.api.deps import get_verified_user, get_uow
from app.domain.models.routine import RoutineType
from app.domain.models.user import User
from app.domain.schemas.routine import RoutineResponse, RoutineUpdate
from app.services.routine import RoutineService
from app.unit_of_work.sqlalchemy import SQLAlchemyUoW

router = APIRouter(prefix="/routines", tags=["routines"])


def get_routine_service(uow: SQLAlchemyUoW = Depends(get_uow)) -> RoutineService:
    return RoutineService(uow)


@router.get("", response_model=list[RoutineResponse])
async def get_routines(
    current_user: User = Depends(get_verified_user),
    service: RoutineService = Depends(get_routine_service),
) -> list[RoutineResponse]:
    return await service.get_or_create_defaults(current_user.id)


@router.patch("/{routine_type}", response_model=RoutineResponse)
async def update_routine(
    routine_type: RoutineType,
    data: RoutineUpdate,
    current_user: User = Depends(get_verified_user),
    service: RoutineService = Depends(get_routine_service),
) -> RoutineResponse:
    return await service.update(current_user.id, routine_type, data.model_dump(exclude_unset=True))
