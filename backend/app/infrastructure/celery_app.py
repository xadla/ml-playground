from celery import Celery  # type: ignore

from app.config import settings

celery_app = Celery(
    "ml-playground",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


# Dummy task for testing
@celery_app.task
def dummy_task(x: int) -> int:
    return x * 2
