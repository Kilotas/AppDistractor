from datetime import datetime

from pydantic import BaseModel

from app.domain.models.session import SessionStatus


class SessionStart(BaseModel):
    task_id: int


class SessionStop(BaseModel):
    session_id: int


class SessionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    task_id: int
    started_at: datetime
    ended_at: datetime | None
    status: SessionStatus
    blocked_attempts: int
    focus_score: float | None
    created_at: datetime
    updated_at: datetime
