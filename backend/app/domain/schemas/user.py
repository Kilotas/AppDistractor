import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.domain.models.user import UserPlan

_PASSWORD_RE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$")


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def validate_passwords(self) -> "UserRegister":
        if self.password != self.confirm_password:
            raise ValueError("Пароли не совпадают")
        if not _PASSWORD_RE.match(self.password):
            raise ValueError(
                "Пароль должен содержать минимум одну заглавную букву, "
                "одну строчную и одну цифру"
            )
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    email: str
    plan: UserPlan
    trial_ends_at: datetime | None
    is_guest: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def validate_passwords(self) -> "ResetPasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Пароли не совпадают")
        if not _PASSWORD_RE.match(self.new_password):
            raise ValueError(
                "Пароль должен содержать минимум одну заглавную букву, "
                "одну строчную и одну цифру"
            )
        return self


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def validate_passwords(self) -> "ChangePasswordRequest":
        if self.new_password != self.confirm_password:
            raise ValueError("Пароли не совпадают")
        if not _PASSWORD_RE.match(self.new_password):
            raise ValueError(
                "Пароль должен содержать минимум одну заглавную букву, "
                "одну строчную и одну цифру"
            )
        return self
