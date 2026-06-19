from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    experiment_ids: list[str] = Field(..., min_length=2)
