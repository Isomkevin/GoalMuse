import json
from typing import Any

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str | None = None
    plan: str = "free"
    notification_preferences: dict[str, Any] | None = None

    class Config:
        from_attributes = True

    @field_validator("notification_preferences", mode="before")
    @classmethod
    def parse_notification_preferences(cls, v: Any) -> dict[str, Any] | None:
        if v is None:
            return None
        if isinstance(v, dict):
            return v
        if isinstance(v, str):
            try:
                return json.loads(v) if v.strip() else None
            except (json.JSONDecodeError, TypeError):
                return None
        return None


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, max_length=255)
    notification_preferences: dict[str, Any] | None = None


class ChangePassword(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=1)


class TokenPayload(BaseModel):
    sub: str  # user id
    exp: int
    type: str = "access"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
