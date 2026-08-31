from datetime import datetime

from pydantic import BaseModel, Field


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    is_active: bool | None = None


class TaskResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    title: str
    description: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    subtask_count: int = 0
    completed_count: int = 0
