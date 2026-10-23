import pytest

from app.domain.models import Session
from app.services.session import SessionService
from tests.conftest import register


async def start(client, headers, task_id):
    return await client.post("/api/v1/sessions/start", json={"task_id": task_id}, headers=headers)


async def stop(client, headers, session_id):
    return await client.post(f"/api/v1/sessions/{session_id}/stop", headers=headers)


async def test_start_session(client, user, task_id):
    resp = await start(client, user, task_id)

    assert resp.status_code == 201
    body = resp.json()
    assert body["task_id"] == task_id
    assert body["status"] == "active"
    assert body["ended_at"] is None


async def test_start_twice_returns_the_active_session(client, user, task_id):
    first = (await start(client, user, task_id)).json()

    second = await start(client, user, task_id)

    assert second.json()["id"] == first["id"]


async def test_stop_session(client, user, task_id):
    session_id = (await start(client, user, task_id)).json()["id"]

    resp = await stop(client, user, session_id)

    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "completed"
    assert body["ended_at"] is not None
    assert body["focus_score"] == 100.0


async def test_stop_twice_is_conflict(client, user, task_id):
    session_id = (await start(client, user, task_id)).json()["id"]
    await stop(client, user, session_id)

    resp = await stop(client, user, session_id)

    assert resp.status_code == 409


async def test_stop_unknown_session(client, user):
    assert (await stop(client, user, 999)).status_code == 404


async def test_new_session_after_stop(client, user, task_id):
    first_id = (await start(client, user, task_id)).json()["id"]
    await stop(client, user, first_id)

    resp = await start(client, user, task_id)

    assert resp.status_code == 201
    assert resp.json()["id"] != first_id


async def test_active_sessions_list(client, user, task_id):
    session_id = (await start(client, user, task_id)).json()["id"]

    active = await client.get("/api/v1/sessions/active", headers=user)
    assert [s["id"] for s in active.json()] == [session_id]

    await stop(client, user, session_id)
    assert (await client.get("/api/v1/sessions/active", headers=user)).json() == []


async def test_cannot_start_session_on_someone_elses_task(client, other_user, task_id):
    assert (await start(client, other_user, task_id)).status_code == 404


async def test_unverified_user_cannot_start_session(client):
    token = (await register(client, "anna@example.com")).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 403 приходит раньше проверки задачи, поэтому её id не важен
    assert (await start(client, headers, 1)).status_code == 403


async def test_requires_auth(client):
    assert (await client.post("/api/v1/sessions/start", json={"task_id": 1})).status_code in (401, 403)


@pytest.mark.parametrize(("blocked_attempts", "score"), [(0, 100.0), (4, 100.0), (5, 90.0), (12, 80.0), (60, 0.0)])
def test_focus_score(blocked_attempts, score):
    assert SessionService._calc_focus_score(Session(blocked_attempts=blocked_attempts)) == score


@pytest.mark.xfail(
    strict=True,
    reason="POST /sessions/{id}/stop не проверяет владельца сессии: любой пользователь может остановить чужую",
)
async def test_cannot_stop_someone_elses_session(client, user, other_user, task_id):
    session_id = (await start(client, user, task_id)).json()["id"]

    resp = await stop(client, other_user, session_id)

    assert resp.status_code == 404
