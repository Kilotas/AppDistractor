from tests.conftest import make_task


async def patch(client, headers, task_id, **fields):
    return await client.patch(f"/api/v1/tasks/{task_id}", json=fields, headers=headers)


async def test_create_task(client, user):
    resp = await client.post(
        "/api/v1/tasks/", json={"title": "Дописать диплом", "description": "глава 2"}, headers=user
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Дописать диплом"
    assert body["description"] == "глава 2"
    assert body["is_active"] is True
    assert body["block_mode"] == "whitelist"


async def test_empty_title_is_rejected(client, user):
    resp = await client.post("/api/v1/tasks/", json={"title": ""}, headers=user)

    assert resp.status_code == 422


async def test_list_shows_only_own_tasks(client, user, other_user):
    await make_task(client, user, "Моя")
    await make_task(client, other_user, "Чужая")

    resp = await client.get("/api/v1/tasks/", headers=user)

    assert [t["title"] for t in resp.json()] == ["Моя"]


async def test_archived_task_is_not_active(client, user, task_id):
    resp = await patch(client, user, task_id, is_active=False)

    assert resp.status_code == 200
    assert resp.json()["is_active"] is False
    active = await client.get("/api/v1/tasks/active", headers=user)
    assert active.json() == []


async def test_delete_task(client, user, task_id):
    assert (await client.delete(f"/api/v1/tasks/{task_id}", headers=user)).status_code == 204
    assert (await client.get(f"/api/v1/tasks/{task_id}", headers=user)).status_code == 404


async def test_someone_elses_task_is_hidden(client, other_user, task_id):
    assert (await client.get(f"/api/v1/tasks/{task_id}", headers=other_user)).status_code == 404
    assert (await patch(client, other_user, task_id, title="Взлом")).status_code == 404
    assert (await client.delete(f"/api/v1/tasks/{task_id}", headers=other_user)).status_code == 404


async def test_requires_auth(client):
    assert (await client.get("/api/v1/tasks/")).status_code in (401, 403)


# ── Режим блокировки (белый / чёрный список) ─────────────

async def test_switch_to_blacklist_and_back(client, user, task_id):
    resp = await patch(client, user, task_id, block_mode="blacklist")

    assert resp.status_code == 200
    assert resp.json()["block_mode"] == "blacklist"
    fetched = await client.get(f"/api/v1/tasks/{task_id}", headers=user)
    assert fetched.json()["block_mode"] == "blacklist"

    resp = await patch(client, user, task_id, block_mode="whitelist")
    assert resp.json()["block_mode"] == "whitelist"


async def test_block_mode_does_not_touch_other_fields(client, user, task_id):
    await patch(client, user, task_id, block_mode="blacklist")

    task = (await client.get(f"/api/v1/tasks/{task_id}", headers=user)).json()

    assert task["title"] == "Дописать диплом"
    assert task["is_active"] is True


async def test_unknown_block_mode_is_rejected(client, user, task_id):
    resp = await patch(client, user, task_id, block_mode="greylist")

    assert resp.status_code == 422


async def test_blacklist_is_free_without_pro(client, user, task_id, db_session):
    """Чёрный список доступен всем: юзер без Pro и с истёкшим триалом всё равно переключает режим."""
    from sqlalchemy import update

    from app.domain.models import User
    from app.domain.models.user import UserPlan

    async with db_session() as s:
        await s.execute(update(User).values(plan=UserPlan.FREE, trial_ends_at=None))
        await s.commit()

    resp = await patch(client, user, task_id, block_mode="blacklist")

    assert resp.status_code == 200
    assert resp.json()["block_mode"] == "blacklist"


async def test_someone_else_cannot_change_block_mode(client, user, other_user, task_id):
    assert (await patch(client, other_user, task_id, block_mode="blacklist")).status_code == 404
    task = (await client.get(f"/api/v1/tasks/{task_id}", headers=user)).json()
    assert task["block_mode"] == "whitelist"
