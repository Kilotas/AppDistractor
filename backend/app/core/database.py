from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_DEBUG,
)

AsyncSessionFactory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    """Базовый класс для всех ORM-моделей."""


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency для FastAPI — открывает сессию и закрывает после запроса."""
    async with AsyncSessionFactory() as session:
        yield session


async def create_all_tables() -> None:
    """Создаёт все таблицы при старте (dev). В prod используй Alembic."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
