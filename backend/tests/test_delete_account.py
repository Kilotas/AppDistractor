from datetime import datetime, timezone

from tests.conftest import PASSWORD, make_task


async def delete_me(client, headers, password: str | None = PASSWORD):
    body = {} if password is None else {"password": password}
    return await client.request("DELETE", "/api/v1/auth/me", json=body, headers=headers)


async def fill_with_data(client, headers) -> int:
    """Задача со всем, что к ней цепляется: подзадача, whitelist, сессия с событием, рутина."""
    task_id = await make_task(client, headers)
    assert (await client.post(f"/api/v1/tasks/{task_id}/subtasks", json={"title": "Глава 1"}, headers=headers)).status_code == 201
    assert (await client.post(f"/api/v1/tasks/{task_id}/whitelist", json={"domain": "github.com"}, headers=headers)).status_code == 201
    session = await client.post("/api/v1/sessions/start", json={"task_id": task_id}, headers=headers)
    event = await client.post(
        "/api/v1/events/",
        json={
            "session_id": session.json()["id"],
            "url": "https://youtube.com/",
            "domain": "youtube.com",
            "attempted_at": datetime.now(timezone.utc).isoformat(),
            "session_minute": 0,
        },
        headers=headers,
    )
    assert event.status_code == 201, event.text
    assert (await client.patch("/api/v1/routines/morning_brief", json={"enabled": True}, headers=headers)).status_code == 200
    return task_id


async def test_delete_account_removes_user_and_data(client, user, other_user):
    await fill_with_data(client, user)
    other_task = await fill_with_data(client, other_user)

    resp = await delete_me(client, user)

    assert resp.status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=user)).status_code == 401
    login = await client.post("/api/v1/auth/login", json={"email": "anna@example.com", "password": PASSWORD})
    assert login.status_code == 401
    # Чужие данные не задеты
    assert (await client.get(f"/api/v1/tasks/{other_task}", headers=other_user)).status_code == 200


async def test_email_can_register_again_after_deletion(client, user):
    await delete_me(client, user)

    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "anna@example.com", "password": PASSWORD, "confirm_password": PASSWORD},
    )

    assert resp.status_code == 201


async def test_wrong_or_missing_password_keeps_account(client, user):
    assert (await delete_me(client, user, "Wrong12345")).status_code == 403
    assert (await delete_me(client, user, None)).status_code == 403

    assert (await client.get("/api/v1/auth/me", headers=user)).status_code == 200


async def test_guest_deletes_without_password(client):
    token = (await client.post("/api/v1/auth/guest")).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    await make_task(client, headers)

    resp = await delete_me(client, headers, None)

    assert resp.status_code == 204
    assert (await client.get("/api/v1/auth/me", headers=headers)).status_code == 401


async def test_delete_requires_auth(client):
    assert (await delete_me(client, {})).status_code in (401, 403)
