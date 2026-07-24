from datetime import datetime

from pydantic import BaseModel, Field


class BlockedEventCreate(BaseModel):
    session_id: int
    url: str = Field(..., max_length=2048)
    domain: str = Field(..., max_length=512)
    attempted_at: datetime
    session_minute: int | None = None
    source: str = Field(default="extension", max_length=32)


class BlockedEventResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    session_id: int
    url: str
    domain: str
    attempted_at: datetime
    session_minute: int | None
    source: str
