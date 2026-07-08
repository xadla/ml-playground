from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.core.dependencies import get_current_user
from app.core.exceptions import (
    BadRequestError,
    ConflictError,
    GoneError,
    NotFoundError,
    UnauthorizedError,
)
from app.db.session import get_db
from app.db.users import User
from app.infrastructure.email import ConsoleEmailSender
from app.models.request.auth import (
    LoginRequest,
    ResendVerificationRequest,
    SignupRequest,
)
from app.models.response.auth import (
    LoginResponse,
    MessageResponse,
    SignupResponse,
    UserResponse,
    VerifyEmailResponse,
)
from app.models.response.error import ErrorResponse
from app.services.auth_service import AuthService
from app.utils.rate_limit import get_email_key, limiter

router = APIRouter(prefix="/auth", tags=["auth"])

# We'll instantiate email sender once (in production, inject via dependency)
email_sender = ConsoleEmailSender()


def get_auth_service(db: Annotated[AsyncSession, Depends(get_db)]) -> AuthService:
    return AuthService(db, email_sender)


# Signup – rate limit 5/minute per IP
@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_202_ACCEPTED,
    responses={
        409: {
            "model": ErrorResponse,
            "description": "Not Authenticated",
        }
    },
)
@limiter.limit("5/minute")  # type: ignore
async def signup(
    request: Request,
    signup_request: SignupRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    try:
        result = await auth_service.signup(
            signup_request.email, signup_request.password
        )
        return result
    except ValueError as e:
        if "already registered" in str(e) or "already pending" in str(e):
            raise ConflictError("Email already registered") from e
        raise


# Login – rate limit 5/minute per IP
@router.post(
    "/login",
    response_model=LoginResponse,
)
@limiter.limit("5/minute")  # type: ignore
async def login(
    request: Request,
    login_request: LoginRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    try:
        result = await auth_service.login(login_request.email, login_request.password)
        return result
    except ValueError as e:
        raise UnauthorizedError() from e


# Logout – no‑op, rate limit 5/minute (or general)
@router.post(
    "/logout",
    response_model=MessageResponse,
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Not Authenticated",
        }
    },
)
@limiter.limit("5/minute")  # type: ignore
async def logout(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    return {"message": "Logged out successfully (token discarded on client)."}


# Get current user – protected, general rate limit
@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {
            "model": ErrorResponse,
            "description": "Not Authenticated",
        }
    },
)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    return await auth_service.get_me(current_user)


# Resend verification – 3 per hour per email
@router.post(
    "/resend-verification",
    response_model=MessageResponse,
)
@limiter.limit("3/hour", key_func=get_email_key)  # type: ignore
async def resend_verification(
    request: Request,
    resend_verification_request: ResendVerificationRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    try:
        result = await auth_service.resend_verification(
            resend_verification_request.email
        )
        return result
    except ValueError as e:
        if "No pending" in str(e):
            raise NotFoundError("User not found") from e
        if "expired" in str(e):
            raise GoneError("The token is expired") from e
        if "already registered" in str(
            e
        ):  # but resend only checks pending, shouldn't happen
            raise ConflictError("The User already verified") from e
        raise BadRequestError() from e


# Verify email – public, maybe rate limit? Not specified, so we can leave without or apply 5/min
@router.get(
    "/verify-email",
    response_model=VerifyEmailResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")  # type: ignore
async def verify_email(
    request: Request,
    token: str,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    try:
        result = await auth_service.verify_email(token)
        return result
    except ValueError as e:
        if "Invalid" in str(e):
            raise NotFoundError("Email not found") from e
        if "expired" in str(e):
            raise GoneError("Token is expired") from e
        raise BadRequestError() from e
