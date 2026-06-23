from datetime import datetime
from typing import Any

from pydantic import BaseModel


class HistoryItemResponse(BaseModel):
    id: str
    dataset_name: str
    algorithm: str
    hyperparameters: dict[str, Any]
    status: str
    top_metric: dict[str, Any] | None  # {"name": "accuracy", "value": 0.85}
    created_at: datetime


class HistoryListResponse(BaseModel):
    items: list[HistoryItemResponse]
    total: int
    page: int
    limit: int
