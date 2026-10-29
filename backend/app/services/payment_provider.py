
"""
Абстракция платёжного провайдера.

Чтобы поменять LemonSqueezy на Stripe/Paddle — достаточно:
  1. Написать новый класс, реализующий PaymentProvider
  2. Поменять PAYMENT_PROVIDER="stripe" в .env

Роуты в billing.py при этом не трогаются.
"""
import hashlib
import hmac
import json
import logging
from dataclasses import dataclass
from typing import Protocol, runtime_checkable

import httpx

from app.core.config import settings
from app.domain.models.user import UserPlan
from app.exceptions import AppError

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PaymentEvent:
    """Что webhook значит для пользователя: какой план ему выставить."""
    user_id: int
    plan: UserPlan


# ──────────────────────────────────────────────────────────────
# Интерфейс — любой провайдер обязан реализовать три метода
# ──────────────────────────────────────────────────────────────

@runtime_checkable
class PaymentProvider(Protocol):
    async def create_checkout(self, user_id: int, email: str) -> str:
        """Создаёт страницу оплаты. Возвращает URL для редиректа."""
        ...

    def verify_signature(self, raw_body: bytes, signature: str) -> bool:
        """Проверяет что webhook пришёл от провайдера, а не от кого попало."""
        ...

    def parse_payment_event(self, raw_body: bytes) -> PaymentEvent | None:
        """
        Разбирает тело webhook.
        Возвращает PaymentEvent если событие меняет план пользователя, иначе None.
        """
        ...


# ──────────────────────────────────────────────────────────────
# Реализация — LemonSqueezy
# ──────────────────────────────────────────────────────────────

class LemonSqueezyProvider:
    _API = "https://api.lemonsqueezy.com/v1"

    async def create_checkout(self, user_id: int, email: str) -> str:
        payload = {
            "data": {
                "type": "checkouts",
                "attributes": {
                    "checkout_data": {
                        "custom": {"user_id": str(user_id)},
                        "email": email,
                    },
                },
                "relationships": {
                    "store":   {"data": {"type": "stores",   "id": settings.LEMONSQUEEZY_STORE_ID}},
                    "variant": {"data": {"type": "variants", "id": settings.LEMONSQUEEZY_VARIANT_ID}},
                },
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self._API}/checkouts",
                json=payload,
                headers={
                    "Authorization": f"Bearer {settings.LEMONSQUEEZY_API_KEY}",
                    "Accept": "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json",
                },
                timeout=10,
            )

        if not response.is_success:
            logger.error("LemonSqueezy checkout failed: status=%d body=%s", response.status_code, response.text[:200])
            raise AppError(f"LemonSqueezy вернул ошибку: {response.status_code}")

        url = response.json()["data"]["attributes"]["url"]
        logger.info("LemonSqueezy checkout created for user_id=%d", user_id)
        return url

    def verify_signature(self, raw_body: bytes, signature: str) -> bool:
        # Без секрета подпись проверить нечем. Пропускаем только локально,
        # иначе любой POST выдал бы себе Pro.
        if not settings.LEMONSQUEEZY_WEBHOOK_SECRET:
            if settings.APP_ENV == "development":
                logger.debug("Webhook signature check skipped (no secret configured)")
                return True
            logger.error("Webhook rejected: LEMONSQUEEZY_WEBHOOK_SECRET is not configured")
            return False

        expected = hmac.new(
            settings.LEMONSQUEEZY_WEBHOOK_SECRET.encode(),
            raw_body,
            hashlib.sha256,
        ).hexdigest()

        valid = hmac.compare_digest(expected, signature)
        if not valid:
            logger.warning("Webhook signature mismatch — possible spoofed request")
        return valid

    # Статусы подписки LemonSqueezy. cancelled — отменена, но оплаченный период
    # ещё идёт: Pro остаётся до subscription_expired. past_due — платёж не прошёл,
    # LemonSqueezy ещё повторяет попытки, поэтому доступ пока не снимаем.
    _PRO_STATUSES = {"on_trial", "active", "past_due", "cancelled"}
    _FREE_STATUSES = {"expired", "unpaid", "paused"}

    def parse_payment_event(self, raw_body: bytes) -> PaymentEvent | None:
        data = json.loads(raw_body)
        meta = data.get("meta", {})
        event_name = meta.get("event_name", "")
        status = data.get("data", {}).get("attributes", {}).get("status")

        if event_name == "order_created":
            plan = UserPlan.FREE if status in ("pending", "failed", "refunded") else UserPlan.PRO
        elif event_name == "order_refunded":
            plan = UserPlan.FREE
        elif event_name.startswith("subscription_") and status in self._PRO_STATUSES:
            plan = UserPlan.PRO
        elif event_name.startswith("subscription_") and status in self._FREE_STATUSES:
            plan = UserPlan.FREE
        else:
            logger.debug("Webhook event ignored: %s status=%s", event_name, status)
            return None

        user_id_str = meta.get("custom_data", {}).get("user_id")
        if not user_id_str:
            logger.warning("Webhook event %s has no user_id in custom_data", event_name)
            return None

        logger.info("Webhook payment event: %s status=%s user_id=%s -> %s", event_name, status, user_id_str, plan.value)
        return PaymentEvent(user_id=int(user_id_str), plan=plan)


# ──────────────────────────────────────────────────────────────
# Фабрика — выбирает провайдер по настройке
# ──────────────────────────────────────────────────────────────

_PROVIDERS: dict[str, type[PaymentProvider]] = {
    "lemonsqueezy": LemonSqueezyProvider,  # type: ignore[type-abstract]
}


def get_payment_provider() -> PaymentProvider:
    """
    Возвращает провайдер по значению PAYMENT_PROVIDER из .env.
    Чтобы добавить Stripe: написать StripeProvider и добавить в _PROVIDERS.
    """
    name = settings.PAYMENT_PROVIDER
    provider_class = _PROVIDERS.get(name)
    if provider_class is None:
        raise AppError(f"Неизвестный платёжный провайдер: '{name}'. Доступны: {list(_PROVIDERS)}")
    return provider_class()
