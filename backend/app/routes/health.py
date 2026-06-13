from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "database": "connected",  # mocked for now
        "redis": "connected",
        "timestamp": "2026-06-07T12:00:00Z",  # use datetime.utcnow() later
    }
