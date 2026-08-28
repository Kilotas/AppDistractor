import logging
from datetime import datetime, timezone

from app.domain.models.routine import Routine, RoutineType
from app.domain.models.user import User
from app.services.email import _send_via_yandex, _send_via_resend
from app.core.config import settings
from app.unit_of_work.protocol import UoWProtocol

logger = logging.getLogger(__name__)

_DEFAULTS = [
    {"type": RoutineType.MORNING_BRIEF, "hour": 7},
    {"type": RoutineType.END_OF_DAY, "hour": 17},
    {"type": RoutineType.WEEKLY_SUMMARY, "hour": 9, "weekday": 1},  # вторник
]


class RoutineService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def get_or_create_defaults(self, user_id: int) -> list[Routine]:
        async with self._uow:
            existing = await self._uow.routines.get_all_for_user(user_id)
            existing_types = {r.type for r in existing}
            for d in _DEFAULTS:
                if d["type"] not in existing_types:
                    routine = Routine(
                        user_id=user_id,
                        type=d["type"],
                        hour=d["hour"],
                        weekday=d.get("weekday", 0),
                    )
                    await self._uow.routines.add(routine)
            await self._uow.commit()
            return await self._uow.routines.get_all_for_user(user_id)

    async def update(self, user_id: int, routine_type: RoutineType, data: dict) -> Routine:
        async with self._uow:
            routine = await self._uow.routines.get_by_type(user_id, routine_type)
            if routine is None:
                raise ValueError(f"Routine {routine_type} not found for user {user_id}")
            for field, value in data.items():
                setattr(routine, field, value)
            await self._uow.commit()
            return routine

    async def run_scheduled(self) -> None:
        now = datetime.now(timezone.utc)
        utc_hour = now.hour
        utc_weekday = now.weekday()

        async with self._uow:
            all_enabled = await self._uow.routines.get_all_enabled()

        for routine in all_enabled:
            local_utc_hour = (routine.hour - routine.timezone_offset) % 24
            if local_utc_hour != utc_hour:
                continue

            if routine.type == RoutineType.WEEKLY_SUMMARY:
                if routine.weekday != utc_weekday:
                    continue

            await self._dispatch(routine, routine.user)

    async def _dispatch(self, routine: Routine, user: User) -> None:
        try:
            if routine.type == RoutineType.MORNING_BRIEF:
                await self._send_morning_brief(user)
            elif routine.type == RoutineType.END_OF_DAY:
                await self._send_end_of_day(user)
            elif routine.type == RoutineType.WEEKLY_SUMMARY:
                await self._send_weekly_summary(user)
        except Exception:
            logger.exception("Failed to send routine %s to user %d", routine.type, user.id)

    async def _send_morning_brief(self, user: User) -> None:
        from app.services.stats import StatsService
        from app.services.task import TaskService

        stats_svc = StatsService(self._uow)
        task_svc = TaskService(self._uow)

        streak = await stats_svc.get_streak(user.id)
        tasks = await task_svc.list_active(user.id)

        html = _build_morning_html(streak.current_streak, tasks)
        await _send_email(user.email, "Доброе утро — FocusVoid", html)
        logger.info("Morning brief sent to user %d", user.id)

    async def _send_end_of_day(self, user: User) -> None:
        from app.services.stats import StatsService

        stats_svc = StatsService(self._uow)
        streak = await stats_svc.get_streak(user.id)
        daily = await stats_svc.get_daily(user.id, days=1)

        today = daily.days[0] if daily.days else None
        focus_minutes = today.focus_minutes if today else 0
        sessions_count = today.sessions_count if today else 0

        html = _build_eod_html(focus_minutes, sessions_count, streak.current_streak)
        await _send_email(user.email, "Итоги дня — FocusVoid", html)
        logger.info("End of day digest sent to user %d", user.id)

    async def _send_weekly_summary(self, user: User) -> None:
        from app.services.stats import StatsService

        stats_svc = StatsService(self._uow)
        daily = await stats_svc.get_daily(user.id, days=7)
        top_tasks = await stats_svc.get_top_tasks(user.id, limit=3)
        streak = await stats_svc.get_streak(user.id)

        total_minutes = sum(d.focus_minutes for d in daily.days)
        active_days = sum(1 for d in daily.days if d.focus_minutes > 0)

        html = _build_weekly_html(total_minutes, active_days, streak.current_streak, top_tasks.tasks)
        await _send_email(user.email, "Итоги недели — FocusVoid", html)
        logger.info("Weekly summary sent to user %d", user.id)


# ── Email senders ────────────────────────────────────────────────────────────

async def _send_email(to_email: str, subject: str, html: str) -> None:
    if settings.YANDEX_SMTP_USER and settings.YANDEX_SMTP_PASSWORD:
        try:
            await _send_via_yandex(to_email, subject, html)
            return
        except Exception:
            logger.exception("Yandex SMTP failed for %s, trying Resend", to_email)
    if settings.RESEND_API_KEY:
        try:
            await _send_via_resend(to_email, subject, html)
            return
        except Exception:
            logger.exception("Resend failed for %s", to_email)
    logger.info("[DEV] Routine email to %s — subject: %s", to_email, subject)


# ── HTML templates ───────────────────────────────────────────────────────────

def _build_morning_html(streak: int, tasks: list) -> str:
    task_items = "".join(
        f'<li style="color:#e2e8f0;margin-bottom:6px;">{t.title}</li>'
        for t in tasks[:7]
    ) or '<li style="color:#8892a4;">Нет активных задач</li>'

    streak_text = f"🔥 Стрик: <strong style='color:#f59e0b;'>{streak} дн.</strong>" if streak > 0 else "Начни сегодня — первый день стрика!"

    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0b0f1a;border-radius:12px;">
        <h2 style="color:#4f7df9;margin-bottom:4px;">FocusVoid</h2>
        <p style="color:#8892a4;margin-top:0;margin-bottom:24px;">Доброе утро ☀️</p>
        <p style="color:#e2e8f0;margin-bottom:8px;">{streak_text}</p>
        <p style="color:#e2e8f0;margin-bottom:8px;font-weight:600;">Задачи на сегодня:</p>
        <ul style="padding-left:20px;margin:0 0 24px;">{task_items}</ul>
        <a href="{settings.APP_URL}" style="display:inline-block;padding:12px 24px;background:#4f7df9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Открыть приложение</a>
    </div>
    """


def _build_eod_html(focus_minutes: int, sessions_count: int, streak: int) -> str:
    hours = focus_minutes // 60
    mins = focus_minutes % 60
    focus_text = f"{hours}ч {mins}мин" if hours else f"{mins} мин"
    streak_text = f"🔥 Стрик: <strong style='color:#f59e0b;'>{streak} дн.</strong>" if streak > 0 else "Стрик не активен"

    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0b0f1a;border-radius:12px;">
        <h2 style="color:#4f7df9;margin-bottom:4px;">FocusVoid</h2>
        <p style="color:#8892a4;margin-top:0;margin-bottom:24px;">Итоги дня 🌙</p>
        <div style="background:#131929;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="color:#8892a4;margin:0 0 4px;font-size:13px;">Время в фокусе</p>
            <p style="color:#4f7df9;font-size:24px;font-weight:700;margin:0;">{focus_text}</p>
        </div>
        <div style="background:#131929;border-radius:8px;padding:16px;margin-bottom:16px;">
            <p style="color:#8892a4;margin:0 0 4px;font-size:13px;">Сессий завершено</p>
            <p style="color:#e2e8f0;font-size:24px;font-weight:700;margin:0;">{sessions_count}</p>
        </div>
        <p style="color:#e2e8f0;margin-bottom:24px;">{streak_text}</p>
        <a href="{settings.APP_URL}" style="display:inline-block;padding:12px 24px;background:#4f7df9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Открыть приложение</a>
    </div>
    """


def _build_weekly_html(total_minutes: int, active_days: int, streak: int, top_tasks: list) -> str:
    hours = total_minutes // 60
    mins = total_minutes % 60
    focus_text = f"{hours}ч {mins}мин" if hours else f"{mins} мин"
    streak_text = f"🔥 Стрик: <strong style='color:#f59e0b;'>{streak} дн.</strong>" if streak > 0 else "Стрик не активен"

    task_rows = "".join(
        f"""<tr>
            <td style="color:#e2e8f0;padding:8px 0;border-bottom:1px solid #1e2a40;">{t.title}</td>
            <td style="color:#4f7df9;text-align:right;padding:8px 0;border-bottom:1px solid #1e2a40;">{t.total_minutes // 60}ч {t.total_minutes % 60}мин</td>
        </tr>"""
        for t in top_tasks
    ) or f'<tr><td colspan="2" style="color:#8892a4;padding:8px 0;">Нет данных</td></tr>'

    return f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0b0f1a;border-radius:12px;">
        <h2 style="color:#4f7df9;margin-bottom:4px;">FocusVoid</h2>
        <p style="color:#8892a4;margin-top:0;margin-bottom:24px;">Итоги недели 📊</p>
        <div style="display:flex;gap:12px;margin-bottom:20px;">
            <div style="flex:1;background:#131929;border-radius:8px;padding:16px;">
                <p style="color:#8892a4;margin:0 0 4px;font-size:12px;">Время в фокусе</p>
                <p style="color:#4f7df9;font-size:20px;font-weight:700;margin:0;">{focus_text}</p>
            </div>
            <div style="flex:1;background:#131929;border-radius:8px;padding:16px;">
                <p style="color:#8892a4;margin:0 0 4px;font-size:12px;">Активных дней</p>
                <p style="color:#e2e8f0;font-size:20px;font-weight:700;margin:0;">{active_days} / 7</p>
            </div>
        </div>
        <p style="color:#e2e8f0;font-weight:600;margin-bottom:8px;">Топ задачи:</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">{task_rows}</table>
        <p style="color:#e2e8f0;margin-bottom:24px;">{streak_text}</p>
        <a href="{settings.APP_URL}" style="display:inline-block;padding:12px 24px;background:#4f7df9;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">Открыть приложение</a>
    </div>
    """
