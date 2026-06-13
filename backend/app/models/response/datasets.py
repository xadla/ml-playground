from datetime import datetime
from typing import Any

from pydantic import BaseModel


class BuiltinDatasetInfo(BaseModel):
    id: str
    name: str
    description: str
    row_count: int
    column_names: list[str]


class BuiltinDatasetsListResponse(BaseModel):
    datasets: list[BuiltinDatasetInfo]


class DatasetUploadResponse(BaseModel):
    id: str
    name: str
    type: str
    row_count: int
    column_names: list[str]
    is_temporary: bool
    created_at: datetime
    preview: list[dict[str, Any]]  # list of records as dicts
