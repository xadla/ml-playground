from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.db.datasets import Dataset
from app.db.experiment_results import ExperimentResult
from app.db.experiments import Experiment
from app.models.domain.enums import ExperimentStatusEnum
from app.services.ml.trainer import train_and_evaluate


def execute_training(db: Session, experiment_id: str):
    """Core training logic that can be called from Celery task or tests."""
    exp = db.query(Experiment).get(experiment_id)
    if not exp:
        return

    exp.status = ExperimentStatusEnum.running
    exp.started_at = datetime.now(UTC)
    db.commit()

    dataset = db.query(Dataset).get(exp.dataset_id)
    if not dataset:
        raise ValueError("Dataset not found")

    x = []
    y = []
    feature_names = ["x", "y"]

    # Prepare data (simplified: canvas only for now)
    if dataset.type == "canvas":
        if dataset.data is not None:
            points = dataset.data["points"]
            x = [[p["x"], p["y"]] for p in points]
            y = [p["class"] for p in points]
            feature_names = dataset.data.get("feature_names", ["x", "y"])
    else:
        raise ValueError("Only canvas datasets supported in this version")

    result = train_and_evaluate(
        algorithm=exp.algorithm,
        hyperparameters=exp.hyperparameters,
        x=x,
        y=y,
        feature_names=feature_names,
    )

    exp_result = ExperimentResult(
        experiment_id=exp.id,
        metrics=result["metrics"],
        confusion_matrix_data=result["confusion_matrix"],
        plot_paths=result["plots"],
    )
    db.add(exp_result)

    exp.status = ExperimentStatusEnum.completed
    exp.completed_at = datetime.now(UTC)
    db.commit()
