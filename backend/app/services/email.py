import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def _build_html(link: str) -> str:
    return f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b0f1a; border-radius: 12px;">
        <h2 style="color: #4f7df9; margin-bottom: 8px;">FocusVoid</h2>
        <p style="color: #e2e8f0; margin-bottom: 24px;">Подтвердите ваш email, чтобы начать работу:</p>
        <a href="{link}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #4f7df9;
            color: #fff;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
        ">Подтвердить email</a>
        <p style="color: #8892a4; font-size: 13px; margin-top: 24px;">
            Ссылка действует 24 часа. Если вы не регистрировались — просто проигнорируйте это письмо.
        </p>
    </div>
    """


async def _send_via_yandex(to_email: str, subject: str, html: str) -> None:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"FocusVoid <{settings.YANDEX_SMTP_FROM}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html", "utf-8"))

    await aiosmtplib.send(
        msg,
        hostname="smtp.yandex.ru",
        port=465,
        username=settings.YANDEX_SMTP_USER,
        password=settings.YANDEX_SMTP_PASSWORD,
        use_tls=True,
    )


async def _send_via_resend(to_email: str, subject: str, html: str) -> None:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": "FocusVoid <onboarding@resend.dev>",
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
            timeout=10.0,
        )
        response.raise_for_status()


def _build_reset_html(link: str) -> str:
    return f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b0f1a; border-radius: 12px;">
        <h2 style="color: #4f7df9; margin-bottom: 8px;">FocusVoid</h2>
        <p style="color: #e2e8f0; margin-bottom: 24px;">Вы запросили сброс пароля. Нажмите кнопку ниже:</p>
        <a href="{link}" style="
            display: inline-block;
            padding: 12px 24px;
            background: #4f7df9;
            color: #fff;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
        ">Сбросить пароль</a>
        <p style="color: #8892a4; font-size: 13px; margin-top: 24px;">
            Ссылка действует 1 час. Если вы не запрашивали сброс — просто проигнорируйте это письмо.
        </p>
    </div>
    """


async def send_reset_email(to_email: str, token: str) -> None:
    link = f"{settings.APP_URL}/reset-password?token={token}"
    subject = "Сброс пароля — FocusVoid"
    html = _build_reset_html(link)

    if settings.YANDEX_SMTP_USER and settings.YANDEX_SMTP_PASSWORD:
        try:
            await _send_via_yandex(to_email, subject, html)
            logger.info("Reset email sent via Yandex SMTP to %s", to_email)
            return
        except Exception:
            logger.exception("Failed to send reset email via Yandex SMTP to %s, trying Resend", to_email)

    if settings.RESEND_API_KEY:
        try:
            await _send_via_resend(to_email, subject, html)
            logger.info("Reset email sent via Resend to %s", to_email)
            return
        except Exception:
            logger.exception("Failed to send reset email via Resend to %s", to_email)

    logger.info("[DEV] Reset link for %s: %s", to_email, link)


def _build_password_changed_html(email: str, app_url: str) -> str:
    return f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0b0f1a; border-radius: 12px;">
        <h2 style="color: #4f7df9; margin-bottom: 8px;">FocusVoid</h2>
        <p style="color: #e2e8f0; margin-bottom: 16px;">Пароль для аккаунта <strong>{email}</strong> был успешно изменён.</p>
        <p style="color: #e2e8f0; margin-bottom: 24px;">Если это были не вы — немедленно восстановите доступ:</p>
        <a href="{app_url}/forgot-password" style="
            display: inline-block;
            padding: 12px 24px;
            background: #ef4444;
            color: #fff;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
        ">Восстановить доступ</a>
        <p style="color: #8892a4; font-size: 13px; margin-top: 24px;">
            Если пароль меняли вы — просто проигнорируйте это письмо.
        </p>
    </div>
    """


async def send_password_changed_email(to_email: str) -> None:
    subject = "Пароль изменён — FocusVoid"
    html = _build_password_changed_html(to_email, settings.APP_URL)

    if settings.YANDEX_SMTP_USER and settings.YANDEX_SMTP_PASSWORD:
        try:
            await _send_via_yandex(to_email, subject, html)
            logger.info("Password changed email sent via Yandex SMTP to %s", to_email)
            return
        except Exception:
            logger.exception("Failed to send password changed email via Yandex to %s, trying Resend", to_email)

    if settings.RESEND_API_KEY:
        try:
            await _send_via_resend(to_email, subject, html)
            logger.info("Password changed email sent via Resend to %s", to_email)
            return
        except Exception:
            logger.exception("Failed to send password changed email via Resend to %s", to_email)

    logger.info("[DEV] Password changed notification for %s", to_email)


async def send_verification_email(to_email: str, token: str) -> None:
    link = f"{settings.APP_URL}/verify?token={token}"
    subject = "Подтвердите email — FocusVoid"
    html = _build_html(link)

    if settings.YANDEX_SMTP_USER and settings.YANDEX_SMTP_PASSWORD:
        try:
            await _send_via_yandex(to_email, subject, html)
            logger.info("Verification email sent via Yandex SMTP to %s", to_email)
            return
        except Exception:
            logger.exception("Failed to send email via Yandex SMTP to %s, trying Resend", to_email)

    if settings.RESEND_API_KEY:
        try:
            await _send_via_resend(to_email, subject, html)
            logger.info("Verification email sent via Resend to %s", to_email)
            return
        except Exception:
            logger.exception("Failed to send email via Resend to %s", to_email)

    logger.info("[DEV] Verification link for %s: %s", to_email, link)
