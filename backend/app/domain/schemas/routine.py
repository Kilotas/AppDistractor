from pydantic import BaseModel, Field

from app.domain.models.routine import RoutineType


class RoutineResponse(BaseModel):
    id: int
    type: RoutineType
    enabled: bool
    hour: int
    timezone_offset: int
    weekday: int

    model_config = {"from_attributes": True}


class RoutineUpdate(BaseModel):
    enabled: bool | None = None
    hour: int | None = Field(default=None, ge=0, le=23)
    timezone_offset: int | None = Field(default=None, ge=-12, le=14)
    weekday: int | None = Field(default=None, ge=0, le=6)
