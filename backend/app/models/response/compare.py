from pydantic import BaseModel


class CompareResponse(BaseModel):
    experiments: list[dict[str, int]]  # simplified experiment data
