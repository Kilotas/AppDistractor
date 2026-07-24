from pydantic import BaseModel


class SessionStats(BaseModel):
    session_id: int
    duration_minutes: int | None
    total_blocked: int
    blocked_per_minute: dict[int, int]
    top_domains: list[dict[str, int | str]]
