async def test_patch_routine_before_first_get(client, user):
    resp = await client.patch("/api/v1/routines/morning_brief", json={"enabled": True}, headers=user)

    assert resp.status_code == 200, resp.text
    assert resp.json()["enabled"] is True
    assert len((await client.get("/api/v1/routines", headers=user)).json()) == 3
