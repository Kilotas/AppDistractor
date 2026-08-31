import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.domain.models.user import User
from app.domain.schemas.user import UserRegister, TokenResponse
from app.exceptions import ConflictError, NotFoundError, AuthError
from app.services.email import send_reset_email, send_verification_email, send_password_changed_email
from app.unit_of_work.protocol import UoWProtocol

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, settings.JWT_SECRET, algorithm=ALGORITHM)


def decode_access_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except Exception:
        raise AuthError("Невалидный токен")


class AuthService:
    def __init__(self, uow: UoWProtocol) -> None:
        self._uow = uow

    async def register(self, data: UserRegister) -> TokenResponse:
        async with self._uow:
            email = data.email.lower()
            existing = await self._uow.users.get_by_email(email)
            if existing is not None:
                logger.warning("Registration attempt with already-taken email: %s", email)
                raise ConflictError(f"Email {email} уже зарегистрирован")

            token = secrets.token_urlsafe(32)
            trial_ends_at = datetime.now(timezone.utc) + timedelta(days=7)
            user = User(
                email=email,
                hashed_password=hash_password(data.password),
                trial_ends_at=trial_ends_at,
                verification_token=token,
                is_verified=False,
            )
            await self._uow.users.add(user)
            await self._uow.commit()
            logger.info("User registered: id=%d email=%s trial_ends=%s", user.id, user.email, trial_ends_at.date())

            await send_verification_email(email, token)

            return TokenResponse(access_token=create_access_token(user.id))

    async def login(self, email: str, password: str) -> TokenResponse:
        async with self._uow:
            user = await self._uow.users.get_by_email(email)
            if user is None or not verify_password(password, user.hashed_password):
                logger.warning("Failed login attempt for email: %s", email)
                raise AuthError("Неверный email или пароль")

            logger.info("User logged in: id=%d email=%s", user.id, user.email)
            return TokenResponse(access_token=create_access_token(user.id))

    async def verify_email(self, token: str) -> TokenResponse:
        async with self._uow:
            user = await self._uow.users.get_by_verification_token(token)
            if user is None:
                logger.warning("Email verification failed: invalid token")
                raise AuthError("Неверная или устаревшая ссылка подтверждения")

            user.is_verified = True
            user.verification_token = None
            await self._uow.commit()
            logger.info("Email verified for user id=%d email=%s", user.id, user.email)
            return TokenResponse(access_token=create_access_token(user.id))

    async def resend_verification(self, user: User) -> None:
        if user.is_verified:
            logger.debug("Resend verification skipped — user id=%d already verified", user.id)
            return
        async with self._uow:
            db_user = await self._uow.users.get_by_id(user.id)
            if db_user is None:
                raise NotFoundError("User", user.id)
            token = secrets.token_urlsafe(32)
            db_user.verification_token = token
            await self._uow.commit()
            logger.info("Verification email resent to user id=%d email=%s", db_user.id, db_user.email)
            await send_verification_email(db_user.email, token)

    async def create_guest(self) -> TokenResponse:
        async with self._uow:
            guest_id = uuid.uuid4().hex[:12]
            user = User(
                email=f"guest_{guest_id}@focusvoid.guest",
                hashed_password=secrets.token_hex(32),
                is_verified=True,
                is_guest=True,
            )
            await self._uow.users.add(user)
            await self._uow.commit()
            logger.info("Guest user created: id=%d email=%s", user.id, user.email)
            return TokenResponse(access_token=create_access_token(user.id))

    async def forgot_password(self, email: str) -> None:
        async with self._uow:
            user = await self._uow.users.get_by_email(email)
            if user is None or user.is_guest:
                # Не раскрываем существование email — просто тихо возвращаем
                logger.info("Forgot password: email not found or guest, silently ignoring: %s", email)
                return

            token = secrets.token_urlsafe(32)
            user.password_reset_token = token
            user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
            await self._uow.commit()
            logger.info("Password reset token set for user id=%d email=%s", user.id, user.email)

        await send_reset_email(email, token)

    async def reset_password(self, token: str, new_password: str) -> None:
        async with self._uow:
            user = await self._uow.users.get_by_reset_token(token)
            if user is None:
                raise AuthError("Неверная или устаревшая ссылка сброса пароля")

            if user.password_reset_expires_at is None or \
               user.password_reset_expires_at < datetime.now(timezone.utc):
                raise AuthError("Срок действия ссылки истёк. Запросите новую.")

            history = await self._uow.password_history.get_last_n(user.id, 5)
            for entry in history:
                if verify_password(new_password, entry.hashed_password):
                    raise AuthError("Этот пароль уже использовался. Придумайте новый.")

            new_hashed = hash_password(new_password)
            await self._uow.password_history.add_for_user(user.id, new_hashed)

            user.hashed_password = new_hashed
            user.password_reset_token = None
            user.password_reset_expires_at = None
            await self._uow.commit()
            logger.info("Password reset successful for user id=%d", user.id)

    async def change_password(self, user_id: int, current_password: str, new_password: str) -> None:
        async with self._uow:
            user = await self._uow.users.get_by_id(user_id)
            if user is None:
                raise NotFoundError("User", user_id)

            if not verify_password(current_password, user.hashed_password):
                raise AuthError("Неверный текущий пароль")

            history = await self._uow.password_history.get_last_n(user.id, 5)
            for entry in history:
                if verify_password(new_password, entry.hashed_password):
                    raise AuthError("Этот пароль уже использовался. Придумайте новый.")

            new_hashed = hash_password(new_password)
            await self._uow.password_history.add_for_user(user.id, new_hashed)
            user.hashed_password = new_hashed
            await self._uow.commit()
            logger.info("Password changed for user id=%d", user.id)

        await send_password_changed_email(user.email)

    async def get_user(self, user_id: int) -> User:
        async with self._uow:
            user = await self._uow.users.get_by_id(user_id)
            if user is None:
                raise NotFoundError("User", user_id)
            return user
