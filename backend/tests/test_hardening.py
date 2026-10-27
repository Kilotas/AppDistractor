import pytest
from pydantic import ValidationError

from app.core.config import Settings


@pytest.mark.parametrize("secret", ["change-me-in-production", "short-secret"])
def test_production_refuses_weak_jwt_secret(secret):
    with pytest.raises(ValidationError):
        Settings(_env_file=None, APP_ENV="production", JWT_SECRET=secret)


def test_production_accepts_strong_jwt_secret():
    settings = Settings(_env_file=None, APP_ENV="production", JWT_SECRET="x" * 64)

    assert settings.APP_DEBUG is False


async def test_login_with_guest_email_is_401_not_500(client):
    token = (await client.post("/api/v1/auth/guest")).json()["access_token"]
    email = (await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})).json()["email"]

    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "Anything123"})

    assert resp.status_code == 401


async def test_task_description_is_limited(client, user):
    resp = await client.post("/api/v1/tasks/", json={"title": "T", "description": "x" * 5001}, headers=user)

    assert resp.status_code == 422
