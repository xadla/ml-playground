from celery import Celery  # type: ignore
from celery import Task as CeleryTask  # type: ignore
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.db.experiments import Experiment
from app.models.domain.enums import ExperimentStatusEnum
from app.services.ml.runner import execute_training

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

# Synchronous engine for Celery tasks
sync_engine = create_engine(settings.SYNC_DATABASE_URL)
SyncSessionLocal = sessionmaker(bind=sync_engine, class_=Session)


@celery_app.task(bind=True, max_retries=3)
def run_training(self: CeleryTask, experiment_id: str):
    db = SyncSessionLocal()
    try:
        execute_training(db, experiment_id)
    except Exception as exc:
        db.rollback()
        # set status failed if possible
        exp = db.query(Experiment).get(experiment_id)
        if exp:
            exp.status = ExperimentStatusEnum.failed
            db.commit()
        raise self.retry(exc=exc) from exc
    finally:
        db.close()
