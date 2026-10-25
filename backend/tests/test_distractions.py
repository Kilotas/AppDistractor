from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.domain.models.user import User
from app.domain.schemas.stats import DistractionStats, DomainCount
from app.services import routine as routine_service
from app.services.routine import RoutineService, _build_weekly_html
from app.unit_of_work.sqlalchemy import SQLAlchemyUoW

YESTERDAY = (datetime.now(UTC) - timedelta(days=1)).replace(minute=0, second=0, microsecond=0)


def at(hour: int, minute: int = 0, days_ago: int = 0) -> datetime:
    return YESTERDAY.replace(hour=hour, minute=minute) - timedelta(days=days_ago)


async def start_session(client, headers, task_id) -> int:
    resp = await client.post("/api/v1/sessions/start", json={"task_id": task_id}, headers=headers)
    return resp.json()["id"]


async def log_event(client, headers, session_id, domain, attempted_at, session_minute=None):
    resp = await client.post(
        "/api/v1/events/",
        json={
            "session_id": session_id,
            "url": f"https://{domain}/feed",
            "domain": domain,
            "attempted_at": attempted_at.isoformat(),
            "session_minute": session_minute,
        },
        headers=headers,
    )
    assert resp.status_code == 201, resp.text


async def distractions(client, headers, **params):
    return await client.get("/api/v1/stats/distractions", params=params, headers=headers)


async def test_no_attempts(client, user):
    body = (await distractions(client, user)).json()

    assert body["total_attempts"] == 0
    assert body["top_domains"] == []
    assert body["by_hour"] == [0] * 24
    assert body["peak_hour"] is None
    assert body["typical_session_minute"] is None


async def test_top_domains_and_peak_hour_in_user_timezone(client, user, task_id):
    session_id = await start_session(client, user, task_id)
    await log_event(client, user, session_id, "youtube.com", at(9, 10), session_minute=3)
    await log_event(client, user, session_id, "youtube.com", at(9, 40), session_minute=7)
    await log_event(client, user, session_id, "vk.com", at(9, 50), session_minute=12)
    await log_event(client, user, session_id, "youtube.com", at(14, 0), session_minute=20)

    body = (await distractions(client, user, tz_offset_minutes=180)).json()

    assert body["total_attempts"] == 4
    assert body["top_domains"] == [{"domain": "youtube.com", "count": 3}, {"domain": "vk.com", "count": 1}]
    # 09:xx UTC — это 12:xx по Москве
    assert body["peak_hour"] == 12
    assert body["by_hour"][12] == 3
    assert body["by_hour"][17] == 1
    assert sum(body["by_hour"]) == 4
    assert body["typical_session_minute"] == 7


async def test_hours_wrap_around_midnight(client, user, task_id):
    session_id = await start_session(client, user, task_id)
    await log_event(client, user, session_id, "reddit.com", at(23, 30))

    body = (await distractions(client, user, tz_offset_minutes=180)).json()

    assert body["peak_hour"] == 2


async def test_period_limits_events(client, user, task_id):
    session_id = await start_session(client, user, task_id)
    await log_event(client, user, session_id, "youtube.com", at(10))
    await log_event(client, user, session_id, "vk.com", at(10, days_ago=40))

    assert (await distractions(client, user, days=30)).json()["total_attempts"] == 1
    assert (await distractions(client, user, days=60)).json()["total_attempts"] == 2


async def test_only_own_events_are_counted(client, user, other_user, task_id):
    session_id = await start_session(client, user, task_id)
    await log_event(client, user, session_id, "youtube.com", at(10))

    assert (await distractions(client, other_user)).json()["total_attempts"] == 0


async def test_rejects_impossible_timezone(client, user):
    assert (await distractions(client, user, tz_offset_minutes=900)).status_code == 422


async def test_insights_name_distracting_sites(client, user, task_id):
    session_id = await start_session(client, user, task_id)
    for minute in (5, 9):
        await log_event(client, user, session_id, "youtube.com", at(10, minute), session_minute=minute)
    await client.post(f"/api/v1/sessions/{session_id}/stop", headers=user)

    resp = await client.get(f"/api/v1/tasks/{task_id}/insights", headers=user)

    assert resp.status_code == 200
    insights = resp.json()["insights"]
    assert "Чаще всего отвлекали: youtube.com (2)." in insights
    assert "Обычно отвлечение случается на 5-й минуте сессии." in insights


async def test_weekly_summary_lists_distractions(client, user, task_id, monkeypatch, db_session):
    session_id = await start_session(client, user, task_id)
    await log_event(client, user, session_id, "youtube.com", at(9))
    sent = []

    async def capture(to_email, subject, html):
        sent.append(html)

    monkeypatch.setattr(routine_service, "_send_email", capture)
    async with db_session() as s:
        anna = (await s.execute(select(User).where(User.email == "anna@example.com"))).scalar_one()

    await RoutineService(SQLAlchemyUoW(db_session))._send_weekly_summary(anna, timezone_offset=3)

    assert "youtube.com" in sent[0]
    assert "Чаще всего — с 12:00 до 13:00" in sent[0]


def test_weekly_html_escapes_domains():
    stats = DistractionStats(
        days=7, total_attempts=1, top_domains=[DomainCount(domain="<script>x</script>", count=1)],
        by_hour=[0] * 24, peak_hour=None, typical_session_minute=None,
    )

    html = _build_weekly_html(0, 0, 0, [], stats)

    assert "<script>" not in html
    assert "&lt;script&gt;" in html


def test_weekly_html_praises_week_without_distractions():
    stats = DistractionStats(
        days=7, total_attempts=0, top_domains=[], by_hour=[0] * 24, peak_hour=None, typical_session_minute=None,
    )

    assert "ни одной попытки отвлечься" in _build_weekly_html(0, 0, 0, [], stats)
