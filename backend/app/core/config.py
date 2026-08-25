from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    DATABASE_URL: str = "sqlite+aiosqlite:///./focus.db"
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]
    JWT_SECRET: str = "change-me-in-production"
    JWT_EXPIRE_DAYS: int = 30
    RESEND_API_KEY: str = ""
    YANDEX_SMTP_USER: str = ""
    YANDEX_SMTP_PASSWORD: str = ""
    YANDEX_SMTP_FROM: str = ""
    APP_URL: str = "http://localhost:5173"
    ANTHROPIC_API_KEY: str = ""
    PAYMENT_PROVIDER: str = "lemonsqueezy"
    LEMONSQUEEZY_API_KEY: str = ""
    LEMONSQUEEZY_STORE_ID: str = ""
    LEMONSQUEEZY_VARIANT_ID: str = ""
    LEMONSQUEEZY_WEBHOOK_SECRET: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return json.loads(v)
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
