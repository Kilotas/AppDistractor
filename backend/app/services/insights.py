from app.domain.schemas.insights import TaskInsights
from app.exceptions import NotFoundError
from app.unit_of_work.protocol import UoWProtocol


class InsightService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def get_for_task(self, task_id: int) -> TaskInsights:
        async with self._uow:
            task = await self._uow.tasks.get_by_id(task_id)
            if task is None:
                raise NotFoundError("Task", task_id)

            sessions = await self._uow.sessions.get_by_task_id(task_id)
            completed = [s for s in sessions if s.focus_score is not None]

            avg_score = (
                round(sum(s.focus_score for s in completed) / len(completed), 1)
                if completed else None
            )

            # TODO: заменить на реальный Claude API вызов
            insights, recommendations = self._stub_insights(completed, avg_score)

            return TaskInsights(
                task_id=task_id,
                total_sessions=len(sessions),
                avg_focus_score=avg_score,
                insights=insights,
                recommendations=recommendations,
            )

    @staticmethod
    def _stub_insights(completed, avg_score):
        if not completed:
            return (
                ["Данных пока недостаточно — проведи хотя бы одну сессию."],
                ["Запусти первую сессию через расширение и вернись сюда."],
            )

        total_blocked = sum(s.blocked_attempts for s in completed)
        best = max(completed, key=lambda s: s.focus_score)
        worst = min(completed, key=lambda s: s.focus_score)

        insights = [
            f"Проведено сессий: {len(completed)}.",
            f"Средний focus score: {avg_score}.",
            f"Всего попыток зайти на заблокированный сайт: {total_blocked}.",
            f"Лучшая сессия — score {round(best.focus_score)}, {best.blocked_attempts} блокировок.",
            f"Сложнейшая сессия — score {round(worst.focus_score)}, {worst.blocked_attempts} блокировок.",
        ]

        recommendations = [
            "Подключи AI-анализ чтобы получить персональные рекомендации на основе паттернов.",
        ]

        return insights, recommendations
