from datetime import UTC, datetime

from celery import Celery  # type: ignore
from celery import Task as CeleryTask  # type: ignore
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.db.datasets import Dataset
from app.db.experiment_results import ExperimentResult
from app.db.experiments import Experiment
from app.models.domain.enums import ExperimentStatusEnum
from app.services.ml.trainer import train_and_evaluate

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


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def run_training(self: CeleryTask, experiment_id: str):
    """Execute ML training for an experiment, update DB with result."""
    db: Session = SyncSessionLocal()
    try:
        experiment = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if not experiment:
            return

        # Update status to running
        experiment.status = ExperimentStatusEnum.running
        experiment.started_at = datetime.now(UTC)
        db.commit()

        # Load dataset
        dataset = db.query(Dataset).filter(Dataset.id == experiment.dataset_id).first()
        if not dataset:
            raise ValueError("Dataset not found")

        # Prepare data
        if dataset.type == "canvas":
            if not dataset.data:
                raise ValueError("Dataset data is empty")
            points = dataset.data["points"]
            x = [[p["x"], p["y"]] for p in points]  # for simplicity assume 2D canvas
            y = [p["class"] for p in points]
            feature_names = (
                dataset.data.get("feature_names", ["x", "y"])
                if dataset.data
                else ["x", "y"]
            )
        elif dataset.type in ("uploaded", "builtin"):
            # Load from file or builtin
            # For builtin we need to load the actual dataset (like Iris). For now, we'll raise an error if we can't load.
            # But since we only have the metadata, we need a way to load builtin data. We'll implement a data loader later.
            # For uploaded, we'd read the CSV file.
            raise ValueError("Builtin/uploaded dataset training not yet implemented")
        else:
            raise ValueError("Unknown dataset type")

        # Run training
        result = train_and_evaluate(
            algorithm=experiment.algorithm,
            hyperparameters=experiment.hyperparameters,
            x=x,
            y=y,
            feature_names=feature_names,
        )

        # Create ExperimentResult
        exp_result = ExperimentResult(
            experiment_id=experiment.id,
            metrics=result["metrics"],
            confusion_matrix_data=result["confusion_matrix"],
            plot_paths=result["plots"],
        )
        db.add(exp_result)

        # Update experiment
        if experiment:
            experiment.status = ExperimentStatusEnum.completed
            experiment.completed_at = datetime.now(UTC)
            db.commit()

    except Exception as exc:
        db.rollback()
        if experiment:
            experiment.status = ExperimentStatusEnum.failed
            # experiment.error_message = str(exc)
            db.commit()
        raise self.retry(exc=exc) from exc
    finally:
        db.close()
