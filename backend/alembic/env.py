"""Alembic environment — async SQLAlchemy + читает DATABASE_URL из Settings.

В Docker достаточно передать переменную окружения DATABASE_URL —
всё остальное подхватится автоматически через app.core.config.settings.
"""

import asyncio
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context

# Импортируем наши настройки и Base со всеми моделями
from app.core.config import settings
from app.core.database import Base

# Импортируем все модели, чтобы autogenerate их видел
import app.domain.models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Offline mode: генерирует SQL без подключения к БД."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Online mode: подключается к БД и применяет миграции."""
    is_sqlite = settings.DATABASE_URL.startswith("sqlite")
    engine_kwargs = {"connect_args": {"check_same_thread": False}} if is_sqlite else {}
    connectable = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
