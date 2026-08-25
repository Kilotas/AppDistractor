import logging

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from app.api.deps import get_uow, get_verified_user
from app.domain.models.user import User, UserPlan
from app.services.payment_provider import get_payment_provider
from app.unit_of_work.sqlalchemy import SQLAlchemyUoW

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout")
async def create_checkout(current_user: User = Depends(get_verified_user)):
    logger.info("Checkout requested by user_id=%d email=%s", current_user.id, current_user.email)
    provider = get_payment_provider()
    url = await provider.create_checkout(current_user.id, current_user.email)
    return {"url": url}


@router.post("/webhook")
async def payment_webhook(request: Request, uow: SQLAlchemyUoW = Depends(get_uow)):
    raw_body = await request.body()
    provider = get_payment_provider()

    signature = request.headers.get("X-Signature", "")
    if not provider.verify_signature(raw_body, signature):
        logger.warning("Webhook rejected: invalid signature from %s", request.client.host if request.client else "unknown")
        return JSONResponse(status_code=400, content={"detail": "Invalid signature"})

    user_id = provider.parse_payment_event(raw_body)
    if user_id is None:
        return {"ok": True}

    async with uow:
        user = await uow.users.get_by_id(user_id)
        if user is not None:
            user.plan = UserPlan.PRO
            user.trial_ends_at = None
            await uow.commit()
            logger.info("User upgraded to PRO: user_id=%d email=%s", user.id, user.email)
        else:
            logger.warning("Webhook payment event for unknown user_id=%d", user_id)

    return {"ok": True}
