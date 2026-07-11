import logging

import structlog
from structlog.typing import Processor

from app.config import settings


def setup_logging() -> None:
    """
    Configure structlog for the entire application.

    After calling this once at startup, any module can do:

        import structlog
        logger = structlog.get_logger(__name__)
        logger.info("user_logged_in", user_id=user.id)

    Output will be colourful console in development, and JSON in production.
    """

    # ── Common processors ────────────────────────────────────────────
    # These are applied to every log record, in order.
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,  # inject request_id, user_id from context
        structlog.stdlib.add_log_level,  # level: "info"
        structlog.stdlib.add_logger_name,  # logger: "app.services.auth"
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        structlog.dev.set_exc_info,  # pretty traceback formatting
    ]

    if settings.DEBUG:
        # Development: coloured, human‑readable console output
        processors = shared_processors + [
            structlog.dev.ConsoleRenderer(colors=True),
        ]
    else:
        # Production: machine‑parsable JSON
        processors = shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ]

    # Apply configuration globally
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Optionally, configure the standard library logging to use structlog
    # so that libraries like uvicorn, sqlalchemy also get processed.
    _configure_stdlib_logging()


def _configure_stdlib_logging() -> None:
    """Redirect standard library logs through structlog's pipeline."""
    # Capture warnings from stdlib and funnel them through structlog
    logging.captureWarnings(True)

    # Set root logger to INFO (or DEBUG if in debug mode)
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    # Remove default handlers (they just print to stderr)
    if root_logger.handlers:
        for handler in root_logger.handlers:
            root_logger.removeHandler(handler)

    # Add a handler that converts stdlib LogRecords to structlog events
    handler = logging.StreamHandler()
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            processor=structlog.processors.JSONRenderer()
            if not settings.DEBUG
            else structlog.dev.ConsoleRenderer(),
        )
    )
    root_logger.addHandler(handler)
