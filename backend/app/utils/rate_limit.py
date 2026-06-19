import json

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


async def get_email_key(request: Request) -> str:
    """For routes that need per-email rate limiting, extract email from JSON body."""
    if request.method == "POST":
        try:
            body = await request.json()
            email = body.get("email")
            if email and isinstance(email, str):
                return email
        except json.JSONDecodeError:
            pass
        except AttributeError:
            pass
        except TypeError:
            pass
        # Fallback to IP address if email not found or any error occurs
        return get_remote_address(request)
    return get_remote_address(request)


limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
