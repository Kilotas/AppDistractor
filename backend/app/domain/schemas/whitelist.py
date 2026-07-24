from datetime import datetime

from pydantic import BaseModel, Field


class WhitelistEntryCreate(BaseModel):
    domain: str = Field(..., min_length=1, max_length=512)
    label: str | None = Field(None, max_length=255)


class WhitelistEntryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    task_id: int
    domain: str
    label: str | None
    created_at: datetime
    updated_at: datetime
