async def add(client, headers, task_id, domain, label=None):
    return await client.post(
        f"/api/v1/tasks/{task_id}/whitelist", json={"domain": domain, "label": label}, headers=headers
    )


async def test_add_entry_normalizes_domain(client, user, task_id):
    resp = await add(client, user, task_id, "  GitHub.com ", label="код")

    assert resp.status_code == 201
    assert resp.json()["domain"] == "github.com"
    assert resp.json()["label"] == "код"


async def test_cyrillic_domain_is_stored_as_punycode(client, user, task_id):
    resp = await add(client, user, task_id, "яндекс.рф")

    assert resp.json()["domain"] == "xn--d1acpjx3f.xn--p1ai"


async def test_put_replaces_whole_list(client, user, task_id):
    await add(client, user, task_id, "github.com")
    await add(client, user, task_id, "stackoverflow.com")

    resp = await client.put(
        f"/api/v1/tasks/{task_id}/whitelist", json=[{"domain": "docs.python.org"}], headers=user
    )

    assert resp.status_code == 200
    listed = await client.get(f"/api/v1/tasks/{task_id}/whitelist", headers=user)
    assert [e["domain"] for e in listed.json()] == ["docs.python.org"]


async def test_delete_entry(client, user, task_id):
    entry_id = (await add(client, user, task_id, "github.com")).json()["id"]

    assert (await client.delete(f"/api/v1/whitelist/{entry_id}", headers=user)).status_code == 204
    assert (await client.get(f"/api/v1/tasks/{task_id}/whitelist", headers=user)).json() == []
    assert (await client.delete(f"/api/v1/whitelist/{entry_id}", headers=user)).status_code == 404


async def test_someone_elses_task_is_hidden(client, other_user, task_id):
    assert (await client.get(f"/api/v1/tasks/{task_id}/whitelist", headers=other_user)).status_code == 404
    assert (await add(client, other_user, task_id, "github.com")).status_code == 404
