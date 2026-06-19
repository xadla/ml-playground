from datetime import datetime

from pydantic import BaseModel


class MessageResponse(BaseModel):  # We can reuse this for other simple messages.
    message: str


class SignupResponse(BaseModel):
    message: str
    email: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str  # UUID as string
    email: str
    created_at: datetime


class VerifyEmailResponse(BaseModel):
    message: str
    access_token: str
    token_type: str = "bearer"
