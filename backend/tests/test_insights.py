async def get_insights(client, headers, task_id):
    return await client.get(f"/api/v1/tasks/{task_id}/insights", headers=headers)


async def test_insights_for_own_task(client, user, task_id):
    # Без завершённых сессий Claude не вызывается — сразу ответ-заглушка
    resp = await get_insights(client, user, task_id)

    assert resp.status_code == 200
    assert resp.json()["task_id"] == task_id
    assert resp.json()["total_sessions"] == 0


async def test_cannot_get_insights_for_someone_elses_task(client, user, other_user, task_id):
    resp = await get_insights(client, other_user, task_id)

    assert resp.status_code == 404
