from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from app.domain.models.user import User
from tests.conftest import PASSWORD, last_token, register

NEW_PASSWORD = "NewFocus777"


async def login(client, email: str, password: str):
    return await client.post("/api/v1/auth/login", json={"email": email, "password": password})


# --- register ---------------------------------------------------------------

async def test_register_returns_token_and_sends_verification(client, outbox):
    resp = await register(client, "Anna@Example.com")

    assert resp.status_code == 201
    token = resp.json()["access_token"]
    assert last_token(outbox, "verify", "anna@example.com")

    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "anna@example.com"
    assert me.json()["is_guest"] is False
    assert me.json()["trial_ends_at"] is not None


async def test_register_duplicate_email_ignores_case(client):
    assert (await register(client, "anna@example.com")).status_code == 201

    resp = await register(client, "ANNA@example.com")

    assert resp.status_code == 409


async def test_register_rejects_weak_password(client):
    resp = await register(client, "anna@example.com", password="alllowercase1")

    assert resp.status_code == 422
    assert "заглавную" in resp.json()["detail"]


async def test_register_rejects_mismatched_passwords(client):
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": "anna@example.com", "password": PASSWORD, "confirm_password": PASSWORD + "x"},
    )

    assert resp.status_code == 422
    assert resp.json()["detail"] == "Пароли не совпадают"


# --- login ------------------------------------------------------------------

async def test_login(client):
    await register(client, "anna@example.com")

    assert (await login(client, "anna@example.com", PASSWORD)).status_code == 200
    assert (await login(client, "anna@example.com", "Wrong12345")).status_code == 401
    assert (await login(client, "nobody@example.com", PASSWORD)).status_code == 401


# --- verify -----------------------------------------------------------------

async def test_unverified_user_is_blocked_until_verify(client, outbox):
    token = (await register(client, "anna@example.com")).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    assert (await client.get("/api/v1/tasks/", headers=headers)).status_code == 403

    verify_token = last_token(outbox, "verify", "anna@example.com")
    resp = await client.post("/api/v1/auth/verify", params={"token": verify_token})
    assert resp.status_code == 200

    assert (await client.get("/api/v1/tasks/", headers=headers)).status_code == 200
    # Ссылка одноразовая
    again = await client.post("/api/v1/auth/verify", params={"token": verify_token})
    assert again.status_code == 401


async def test_verify_with_unknown_token(client):
    resp = await client.post("/api/v1/auth/verify", params={"token": "not-a-real-token"})

    assert resp.status_code == 401


# --- resend verification ------------------------------------------------------

async def test_resend_verification_replaces_token(client, outbox):
    await register(client, "anna@example.com")
    old_token = last_token(outbox, "verify", "anna@example.com")

    resp = await client.post("/api/v1/auth/resend-verification", json={"email": "anna@example.com"})

    assert resp.status_code == 200
    new_token = last_token(outbox, "verify", "anna@example.com")
    assert new_token != old_token
    assert (await client.post("/api/v1/auth/verify", params={"token": old_token})).status_code == 401
    assert (await client.post("/api/v1/auth/verify", params={"token": new_token})).status_code == 200


async def test_resend_verification_is_silent_for_unknown_and_verified(client, outbox, user):
    sent_before = len(outbox)

    for email in ("nobody@example.com", "anna@example.com"):
        resp = await client.post("/api/v1/auth/resend-verification", json={"email": email})
        assert resp.status_code == 200

    assert len(outbox) == sent_before


# --- forgot / reset password --------------------------------------------------

async def reset(client, token: str, password: str = NEW_PASSWORD):
    return await client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": password, "confirm_password": password},
    )


async def test_forgot_and_reset_password(client, outbox):
    await register(client, "anna@example.com")

    resp = await client.post("/api/v1/auth/forgot-password", json={"email": "anna@example.com"})
    assert resp.status_code == 200
    reset_token = last_token(outbox, "reset", "anna@example.com")

    assert (await reset(client, reset_token)).status_code == 200
    assert (await login(client, "anna@example.com", NEW_PASSWORD)).status_code == 200
    assert (await login(client, "anna@example.com", PASSWORD)).status_code == 401
    # Ссылка одноразовая
    assert (await reset(client, reset_token, "Another999")).status_code == 401


async def test_forgot_password_is_silent_for_unknown_email(client, outbox):
    resp = await client.post("/api/v1/auth/forgot-password", json={"email": "nobody@example.com"})

    assert resp.status_code == 200
    assert outbox == []


async def test_reset_password_with_expired_link(client, outbox, db_session):
    await register(client, "anna@example.com")
    await client.post("/api/v1/auth/forgot-password", json={"email": "anna@example.com"})
    async with db_session() as s:
        await s.execute(
            update(User)
            .where(User.email == "anna@example.com")
            .values(password_reset_expires_at=datetime.now(timezone.utc) - timedelta(minutes=1))
        )
        await s.commit()

    resp = await reset(client, last_token(outbox, "reset", "anna@example.com"))

    assert resp.status_code == 401
    assert "истёк" in resp.json()["detail"]


async def test_reset_password_rejects_recently_used_password(client, outbox):
    await register(client, "anna@example.com")
    for _ in range(2):
        await client.post("/api/v1/auth/forgot-password", json={"email": "anna@example.com"})
        resp = await reset(client, last_token(outbox, "reset", "anna@example.com"))

    assert resp.status_code == 401
    assert "уже использовался" in resp.json()["detail"]
