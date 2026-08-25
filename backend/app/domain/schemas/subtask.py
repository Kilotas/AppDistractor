from datetime import datetime

from pydantic import BaseModel, Field


class SubtaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)


class SubtaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    is_completed: bool | None = None


class SubtaskResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    task_id: int
    title: str
    is_completed: bool
    position: int
    created_at: datetime
    updated_at: datetime
