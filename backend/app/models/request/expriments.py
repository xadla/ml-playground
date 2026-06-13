from typing import Any, Literal

from pydantic import BaseModel, Field

from app.models.domain.enums import AlgorithmEnum


# ----- Canvas dataset point -----
class CanvasPoint(BaseModel):
    x: float
    y: float
    class_: str = Field(..., alias="class")  # JSON key "class"
    # Pydantic allows alias; we'll configure model to populate by alias

    class Config:
        populate_by_name = True  # allows both 'class' and 'class_'


class CanvasDataset(BaseModel):
    type: Literal["canvas"]
    name: str
    points: list[CanvasPoint]
    feature_names: list[str]


# ----- Uploaded/Builtin dataset reference -----
class UploadedDataset(BaseModel):
    type: Literal["uploaded"]
    id: str  # dataset UUID


class BuiltinDataset(BaseModel):
    type: Literal["builtin"]
    id: str  # e.g., "builtin_iris"


# Discriminated union
DatasetSpec = CanvasDataset | UploadedDataset | BuiltinDataset


class CreateExperimentRequest(BaseModel):
    dataset: DatasetSpec = Field(..., discriminator="type")
    algorithm: AlgorithmEnum
    hyperparameters: dict[str, Any]  # we can further validate per algorithm later
    target_column: str
