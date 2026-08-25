import logging
from datetime import date, timedelta, timezone, datetime, UTC

from app.domain.schemas.stats import DailyActivity, DailyStats, StreakStats
from app.unit_of_work.protocol import UoWProtocol

logger = logging.getLogger(__name__)


class StatsService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def get_streak(self, user_id: int) -> StreakStats:
        async with self._uow:
            dates = await self._uow.sessions.get_completed_dates_for_user(user_id)

        if not dates:
            return StreakStats(
                current_streak=0,
                longest_streak=0,
                total_days_active=0,
                last_active_date=None,
            )

        sorted_dates = sorted(set(dates))
        total_days_active = len(sorted_dates)
        last_active_date = sorted_dates[-1]

        longest_streak = self._calc_longest(sorted_dates)
        current_streak = self._calc_current(sorted_dates, last_active_date)

        logger.info(
            "Streak stats: user_id=%d current=%d longest=%d total_days=%d",
            user_id, current_streak, longest_streak, total_days_active,
        )
        return StreakStats(
            current_streak=current_streak,
            longest_streak=longest_streak,
            total_days_active=total_days_active,
            last_active_date=last_active_date,
        )

    async def get_daily(self, user_id: int, days: int = 30) -> DailyStats:
        since = datetime.now(UTC).date() - timedelta(days=days - 1)
        async with self._uow:
            rows = await self._uow.sessions.get_daily_stats_for_user(user_id, since)

        by_date = {r[0]: DailyActivity(date=r[0], focus_minutes=r[1], sessions_count=r[2])
                   for r in rows}

        # заполняем дни без активности нулями
        result = []
        for i in range(days):
            d = since + timedelta(days=i)
            result.append(by_date.get(d, DailyActivity(date=d, focus_minutes=0, sessions_count=0)))

        logger.info("Daily stats: user_id=%d days=%d active_days=%d", user_id, days, len(by_date))
        return DailyStats(days=result)

    @staticmethod
    def _calc_longest(sorted_dates: list[date]) -> int:
        longest = 1
        run = 1
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                run += 1
                if run > longest:
                    longest = run
            else:
                run = 1
        return longest

    @staticmethod
    def _calc_current(sorted_dates: list[date], last_active: date) -> int:
        today = datetime.now(timezone.utc).date()
        # стрик живой только если активность была сегодня или вчера
        if last_active < today - timedelta(days=1):
            return 0

        current = 1
        for i in range(len(sorted_dates) - 1, 0, -1):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                current += 1
            else:
                break
        return current
