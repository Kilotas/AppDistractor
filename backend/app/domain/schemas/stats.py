from datetime import date

from pydantic import BaseModel


class SessionStats(BaseModel):
    session_id: int
    duration_minutes: int | None
    total_blocked: int
    blocked_per_minute: dict[int, int]
    top_domains: list[dict[str, int | str]]


class StreakStats(BaseModel):
    current_streak: int
    longest_streak: int
    total_days_active: int
    last_active_date: date | None


class DailyActivity(BaseModel):
    date: date
    focus_minutes: int
    sessions_count: int


class DailyStats(BaseModel):
    days: list[DailyActivity]
