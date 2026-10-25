"""
Общие фикстуры тестов.

Тесты ходят в API через httpx + ASGI и пишут в настоящий Postgres (как на проде).
База берётся из TEST_DATABASE_URL; по умолчанию — одноразовый контейнер на 5433
(5432 часто занят локальным Postgres или контейнером db из docker-compose):

    docker run -d --name focusvoid-test-db -p 5433:5432 --tmpfs /var/lib/postgresql/data \
        -e POSTGRES_USER=focus -e POSTGRES_PASSWORD=focus -e POSTGRES_DB=focus_test postgres:16-alpine

Перед каждым тестом таблицы создаются, после — очищаются.
"""
import os

# Настройки читаются при импорте app.*, поэтому окружение задаём до импорта.
os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://focus:focus@localhost:5433/focus_test",
)
os.environ["APP_ENV"] = "test"
os.environ["APP_DEBUG"] = "false"
# Пустые ключи перекрывают .env: никаких реальных писем и запросов к Claude.
for _key in ("RESEND_API_KEY", "YANDEX_SMTP_USER", "YANDEX_SMTP_PASSWORD", "ANTHROPIC_API_KEY"):
    os.environ[_key] = ""

if not os.environ["DATABASE_URL"].rsplit("/", 1)[-1].endswith("_test"):
    raise RuntimeError(
        "Тесты очищают таблицы — имя базы должно оканчиваться на _test, "
        f"а сейчас DATABASE_URL={os.environ['DATABASE_URL']}"
    )

import sentry_sdk

# app.main вызывает sentry_sdk.init с боевым DSN — в тестах он не нужен.
sentry_sdk.init = lambda *args, **kwargs: None

import httpx
import pytest
from sqlalchemy import text

from app.core.database import AsyncSessionFactory, Base, engine
from app.main import app, limiter
from app.services import auth as auth_service

# Лимиты вроде 5 регистраций в минуту мешают тестам; проверяем логику, а не slowapi.
limiter.enabled = False

PASSWORD = "Focus12345"


@pytest.fixture(autouse=True)
async def db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        tables = ", ".join(f'"{t.name}"' for t in Base.metadata.sorted_tables)
        await conn.execute(text(f"TRUNCATE {tables} RESTART IDENTITY CASCADE"))
    # Соединения пула привязаны к event loop теста — закрываем их до следующего.
    await engine.dispose()


@pytest.fixture
def db_session():
    return AsyncSessionFactory


@pytest.fixture(autouse=True)
def outbox(monkeypatch) -> list[dict]:
    """Вместо отправки писем складывает их сюда: {"kind", "to", "token"}."""
    sent: list[dict] = []

    def recorder(kind: str):
        async def send(to_email: str, token: str | None = None) -> None:
            sent.append({"kind": kind, "to": to_email, "token": token})
        return send

    monkeypatch.setattr(auth_service, "send_verification_email", recorder("verify"))
    monkeypatch.setattr(auth_service, "send_reset_email", recorder("reset"))
    monkeypatch.setattr(auth_service, "send_password_changed_email", recorder("password_changed"))
    return sent


@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


def last_token(outbox: list[dict], kind: str, email: str) -> str:
    for mail in reversed(outbox):
        if mail["kind"] == kind and mail["to"] == email:
            return mail["token"]
    raise AssertionError(f"Письмо {kind} для {email} не отправлялось")


async def register(client: httpx.AsyncClient, email: str, password: str = PASSWORD) -> httpx.Response:
    return await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "confirm_password": password},
    )


async def make_verified_user(client: httpx.AsyncClient, outbox: list[dict], email: str) -> dict:
    """Регистрирует и подтверждает пользователя, возвращает заголовки авторизации."""
    resp = await register(client, email)
    assert resp.status_code == 201, resp.text
    resp = await client.post("/api/v1/auth/verify", params={"token": last_token(outbox, "verify", email)})
    assert resp.status_code == 200, resp.text
    return {"Authorization": f"Bearer {resp.json()['access_token']}"}


async def make_task(client: httpx.AsyncClient, headers: dict, title: str = "Дописать диплом") -> int:
    resp = await client.post("/api/v1/tasks/", json={"title": title}, headers=headers)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


@pytest.fixture
async def user(client, outbox) -> dict:
    return await make_verified_user(client, outbox, "anna@example.com")


@pytest.fixture
async def other_user(client, outbox) -> dict:
    return await make_verified_user(client, outbox, "boris@example.com")


@pytest.fixture
async def task_id(client, user) -> int:
    return await make_task(client, user)
