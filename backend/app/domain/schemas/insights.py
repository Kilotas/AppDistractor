from pydantic import BaseModel


class TaskInsights(BaseModel):
    task_id: int
    total_sessions: int
    avg_focus_score: float | None
    insights: list[str]
    recommendations: list[str]
