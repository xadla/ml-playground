from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.core.error_handlers import (
    app_error_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.core.exceptions import AppError
from app.core.middleware import RequestContextMiddleware
from app.routes.auth import router as auth_router
from app.routes.datasets import router as datasets_router
from app.routes.experiments import router as experiments_router
from app.routes.health import router as health_router
from app.routes.history import router as history_router
from app.routes.plots import router as plots_router
from app.utils.logging_config import setup_logging
from app.utils.rate_limit import limiter


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    )

    # Logging
    setup_logging()
    app.add_middleware(RequestContextMiddleware)

    # Rate limiter
    app.state.limiter = limiter
    app.add_middleware(SlowAPIMiddleware)

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request, exc):  # type: ignore
        return JSONResponse(
            status_code=429, content={"error": "Too many requests. Try again later."}
        )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Global exception handlers (basic ones; will be refined later)
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):  # type: ignore
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred.",
                }
            },
        )

    # Include routers
    app.include_router(health_router, prefix=settings.API_V1_PREFIX)
    app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
    app.include_router(datasets_router, prefix=settings.API_V1_PREFIX)
    app.include_router(experiments_router, prefix=settings.API_V1_PREFIX)
    app.include_router(history_router, prefix=settings.API_V1_PREFIX)
    app.include_router(plots_router, prefix=settings.API_V1_PREFIX)

    # Error handlers
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)

    return app


app = create_app()
