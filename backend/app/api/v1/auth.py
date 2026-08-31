from fastapi import APIRouter, Depends, Request

from app.api.deps import get_auth_service, get_current_user
from app.domain.models.user import User
from app.domain.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.main import limiter
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("5/minute")
async def register(
    request: Request,
    data: UserRegister,
    service: AuthService = Depends(get_auth_service),
):
    return await service.register(data)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    data: UserLogin,
    service: AuthService = Depends(get_auth_service),
):
    return await service.login(data.email, data.password)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/verify", response_model=TokenResponse)
@limiter.limit("10/minute")
async def verify_email(
    request: Request,
    token: str,
    service: AuthService = Depends(get_auth_service),
):
    return await service.verify_email(token)


@router.post("/guest", response_model=TokenResponse)
@limiter.limit("10/minute")
async def guest_login(
    request: Request,
    service: AuthService = Depends(get_auth_service),
):
    return await service.create_guest()


@router.post("/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.resend_verification(current_user)
    return {"detail": "Письмо отправлено"}


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    data: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    await service.forgot_password(data.email)
    return {"detail": "Если email зарегистрирован — письмо отправлено"}


@router.post("/reset-password")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    data: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
):
    await service.reset_password(data.token, data.new_password)
    return {"detail": "Пароль успешно изменён"}


@router.post("/change-password")
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    await service.change_password(current_user.id, data.current_password, data.new_password)
    return {"detail": "Пароль успешно изменён"}
