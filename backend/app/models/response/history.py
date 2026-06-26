from datetime import datetime
from typing import Any

from pydantic import BaseModel


class HistoryItemResponse(BaseModel):
    id: str
    dataset_name: str
    dataset_id: str | None = None
    algorithm: str
    hyperparameters: dict[str, Any]
    status: str | None = None
    top_metric: dict[str, Any] | None = None
    metrics: dict[str, Any] | None = None
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None

    model_config = {"from_attributes": True}


class HistoryListResponse(BaseModel):
    items: list[HistoryItemResponse]
    total: int
    page: int
    limit: int


class CompareResponse(BaseModel):
    experiments: list[HistoryItemResponse]
