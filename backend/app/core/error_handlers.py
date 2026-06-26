from typing import Any

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppError
from app.models.response.error import ErrorDetail, ErrorResponse, ErrorWrapper


def build_error_response(
    status_code: int, code: str, message: str, details: list[Any] | None = None
) -> ErrorResponse:
    """Build a spec-compliant error response."""
    return ErrorResponse(
        error=ErrorWrapper(
            code=code,
            message=message,
            details=details or [],
        )
    )


async def app_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle AppError exceptions."""
    if isinstance(exc, AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_response(
                exc.status_code, exc.code, exc.message, exc.details
            ).model_dump(),
        )
    # Fallback for other exceptions
    return JSONResponse(
        status_code=500,
        content=build_error_response(
            500, "INTERNAL_ERROR", "An unexpected error occurred."
        ).model_dump(),
    )


async def http_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle HTTP exceptions."""
    if not isinstance(exc, StarletteHTTPException):
        return JSONResponse(
            status_code=500,
            content=build_error_response(
                500, "INTERNAL_ERROR", "An unexpected error occurred."
            ).model_dump(),
        )

    # Map common status codes to our error codes
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        409: "CONFLICT",
        410: "GONE",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_ERROR",
    }
    code = code_map.get(exc.status_code, "HTTP_ERROR")
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_response(exc.status_code, code, exc.detail).model_dump(),
    )


async def validation_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Handle validation errors."""
    if isinstance(exc, RequestValidationError):
        # Extract field-level errors from pydantic
        details = []
        for error in exc.errors():
            field = (
                ".".join(str(loc) for loc in error["loc"][1:])
                if len(error["loc"]) > 1
                else "body"
            )
            details.append(ErrorDetail(field=field, message=error["msg"]))
        return JSONResponse(
            status_code=422,
            content=build_error_response(
                422, "VALIDATION_ERROR", "The request was invalid.", details
            ).model_dump(),
        )

    # Fallback for other exceptions
    return JSONResponse(
        status_code=500,
        content=build_error_response(
            500, "INTERNAL_ERROR", "An unexpected error occurred."
        ).model_dump(),
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=build_error_response(
            500, "INTERNAL_ERROR", "An unexpected error occurred."
        ).model_dump(),
    )
