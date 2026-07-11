import uuid

import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = structlog.get_logger(__name__)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """
    Clear any old context, create a fresh request_id, and bind it.
    Also adds the id to the response header.
    """

    async def dispatch(self, request: Request, call_next):
        # Clear context from previous request (important for async!)
        structlog.contextvars.clear_contextvars()
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        structlog.contextvars.bind_contextvars(request_id=request_id)

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response
