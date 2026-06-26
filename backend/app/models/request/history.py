from typing import Literal

from pydantic import BaseModel, Field


class HistoryListParams(BaseModel):
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort_by: Literal["created_at", "algorithm", "metric"] = "created_at"
    order: Literal["asc", "desc"] = "desc"


class CompareRequest(BaseModel):
    experiment_ids: list[str] = Field(
        ...,
        min_length=2,
        max_length=10,
        description="List of experiment IDs to compare (minimum 2, maximum 10)",
    )
