from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.domain.enums import AlgorithmEnum, ExperimentStatusEnum


class ExperimentCreateResponse(BaseModel):
    experiment_id: str
    status: ExperimentStatusEnum
    message: str


class MetricsResult(BaseModel):
    accuracy: float | None = None
    precision: float | None = None
    recall: float | None = None
    f1_score: float | None = None


class ExperimentResult(BaseModel):
    metrics: MetricsResult
    confusion_matrix: list[list[int]]
    plots: dict[str, str]  # {"decision_boundary": "url", ...}


class ExperimentStatusResponse(BaseModel):
    id: str
    status: ExperimentStatusEnum
    algorithm: AlgorithmEnum | None = None
    hyperparameters: dict[str, Any] | None = None
    dataset_name: str | None = None
    dataset_id: str | None = None
    created_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    result: ExperimentResult | None = None
    error_message: str | None = None  # for failed status
