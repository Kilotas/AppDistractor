import json
import logging

import anthropic

logger = logging.getLogger(__name__)

from app.core.config import settings
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

            if not completed:
                return TaskInsights(
                    task_id=task_id,
                    total_sessions=len(sessions),
                    avg_focus_score=avg_score,
                    insights=["Данных пока недостаточно — проведи хотя бы одну сессию."],
                    recommendations=["Запусти первую сессию через расширение и вернись сюда."],
                )

            if settings.ANTHROPIC_API_KEY:
                logger.info("Requesting Claude insights for task_id=%d sessions=%d avg_score=%s", task_id, len(completed), avg_score)
                insights, recommendations = await self._claude_insights(task, completed, avg_score)
                logger.info("Claude insights received for task_id=%d", task_id)
            else:
                logger.debug("No ANTHROPIC_API_KEY — using stub insights for task_id=%d", task_id)
                insights, recommendations = self._stub_insights(completed, avg_score)

            return TaskInsights(
                task_id=task_id,
                total_sessions=len(sessions),
                avg_focus_score=avg_score,
                insights=insights,
                recommendations=recommendations,
            )

    @staticmethod
    async def _claude_insights(task, completed, avg_score):
        total_blocked = sum(s.blocked_attempts for s in completed)
        best = max(completed, key=lambda s: s.focus_score)
        worst = min(completed, key=lambda s: s.focus_score)

        prompt = f"""Ты — ассистент по продуктивности. Проанализируй данные о фокус-сессиях пользователя и дай полезные инсайты.

Задача: "{task.title}"
{f'Описание: {task.description}' if task.description else ''}

Статистика сессий:
- Завершённых сессий: {len(completed)}
- Средний focus score: {avg_score}/100
- Всего попыток зайти на заблокированный сайт: {total_blocked}
- Лучшая сессия: score {round(best.focus_score)}, {best.blocked_attempts} блокировок
- Худшая сессия: score {round(worst.focus_score)}, {worst.blocked_attempts} блокировок

Ответь строго в JSON формате (без markdown, только JSON):
{{
  "insights": ["инсайт 1", "инсайт 2", "инсайт 3"],
  "recommendations": ["рекомендация 1", "рекомендация 2"]
}}

Инсайты — наблюдения о паттернах. Рекомендации — конкретные действия для улучшения. Пиши по-русски, кратко."""

        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
        )

        text = message.content[0].text.strip()
        data = json.loads(text)
        return data["insights"], data["recommendations"]

    @staticmethod
    def _stub_insights(completed, avg_score):
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
            "Добавь ANTHROPIC_API_KEY в .env чтобы получить персональные рекомендации от AI.",
        ]
        return insights, recommendations
