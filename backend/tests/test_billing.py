import hashlib
import hmac
import json

import pytest

from app.core.config import settings

SECRET = "test-webhook-secret"


def order_event(user_id: int) -> bytes:
    return json.dumps(
        {"meta": {"event_name": "order_created", "custom_data": {"user_id": str(user_id)}}}
    ).encode()


def sign(body: bytes, secret: str = SECRET) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


async def me(client, headers) -> dict:
    return (await client.get("/api/v1/auth/me", headers=headers)).json()


async def post_webhook(client, body: bytes, signature: str | None = None):
    headers = {"Content-Type": "application/json"}
    if signature is not None:
        headers["X-Signature"] = signature
    return await client.post("/api/v1/billing/webhook", content=body, headers=headers)


async def test_webhook_without_secret_is_rejected_outside_dev(client, user, monkeypatch):
    monkeypatch.setattr(settings, "LEMONSQUEEZY_WEBHOOK_SECRET", "")
    body = order_event((await me(client, user))["id"])

    resp = await post_webhook(client, body)

    assert resp.status_code == 400
    assert (await me(client, user))["plan"] != "pro"


@pytest.mark.parametrize("signature", [None, "", "0" * 64, sign(b"other body")])
async def test_webhook_with_bad_signature_is_rejected(client, user, monkeypatch, signature):
    monkeypatch.setattr(settings, "LEMONSQUEEZY_WEBHOOK_SECRET", SECRET)
    body = order_event((await me(client, user))["id"])

    resp = await post_webhook(client, body, signature)

    assert resp.status_code == 400
    assert (await me(client, user))["plan"] != "pro"


async def test_webhook_with_valid_signature_upgrades_user(client, user, monkeypatch):
    monkeypatch.setattr(settings, "LEMONSQUEEZY_WEBHOOK_SECRET", SECRET)
    body = order_event((await me(client, user))["id"])

    resp = await post_webhook(client, body, sign(body))

    assert resp.status_code == 200
    assert (await me(client, user))["plan"] == "pro"
