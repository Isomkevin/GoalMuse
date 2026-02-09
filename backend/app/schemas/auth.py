from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True


class TokenPayload(BaseModel):
    sub: str  # user id
    exp: int
    type: str = "access"


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
