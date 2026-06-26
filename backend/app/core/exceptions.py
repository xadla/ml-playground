from typing import Any


class AppError(Exception):
    """Base exception for all application errors."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message: str,
        details: list[dict[str, Any]] | None = None,
    ):
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details or []
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(
        self,
        message: str = "Resource not found",
        details: list[dict[str, Any]] | None = None,
    ):
        super().__init__(404, "NOT_FOUND", message, details)


class ConflictError(AppError):
    def __init__(
        self, message: str = "Conflict", details: list[dict[str, Any]] | None = None
    ):
        super().__init__(409, "CONFLICT", message, details)


class UnauthorizedError(AppError):
    def __init__(
        self, message: str = "Unauthorized", details: list[dict[str, Any]] | None = None
    ):
        super().__init__(401, "UNAUTHORIZED", message, details)


class ForbiddenError(AppError):
    def __init__(
        self, message: str = "Forbidden", details: list[dict[str, Any]] | None = None
    ):
        super().__init__(403, "FORBIDDEN", message, details)


class ValidationError(AppError):
    def __init__(
        self,
        message: str = "Validation error",
        details: list[dict[str, Any]] | None = None,
    ):
        super().__init__(422, "VALIDATION_ERROR", message, details)


class GoneError(AppError):
    def __init__(
        self,
        message: str = "Resource gone",
        details: list[dict[str, Any]] | None = None,
    ):
        super().__init__(410, "GONE", message, details)


class BadRequestError(AppError):
    def __init__(
        self, message: str = "Bad request", details: list[dict[str, Any]] | None = None
    ):
        super().__init__(400, "BAD_REQUEST", message, details)
