from typing import Annotated, Any

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.db.session import get_db
from app.models.response.datasets import (
    BuiltinDatasetsListResponse,
    DatasetUploadResponse,
)
from app.services.dataset_service import DatasetService
from app.utils.rate_limit import limiter

router = APIRouter(prefix="/datasets", tags=["datasets"])


def get_dataset_service(db: Annotated[AsyncSession, Depends(get_db)]) -> DatasetService:
    return DatasetService(db)


@router.get("/builtin", response_model=BuiltinDatasetsListResponse)
async def list_builtin_datasets(
    service: Annotated[DatasetService, Depends(get_dataset_service)],
):
    datasets = service.list_builtin_datasets()
    return {"datasets": datasets}


@router.post(
    "/upload",
    response_model=DatasetUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("60/minute")  # type: ignore
async def upload_dataset(
    request: Request,
    service: Annotated[DatasetService, Depends(get_dataset_service)],
    file: UploadFile = File(...),  # noqa: B008
    name: str | None = Form(None),  # noqa: B008
) -> dict[str, Any]:
    if file.filename is None:
        raise HTTPException(status_code=400, detail="No file provided")

    # Validate content type hint
    if (
        file.content_type
        and "csv" not in file.content_type
        and "text" not in file.content_type
    ):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    # Read file content
    try:
        contents = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=400, detail="Failed to read uploaded file"
        ) from e

    try:
        dataset, preview = await service.upload_csv(
            file_content=contents,
            filename=name or file.filename,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    return {
        "id": str(dataset.id),
        "name": dataset.name,
        "type": dataset.type.value,
        "row_count": dataset.row_count,
        "column_names": dataset.column_names,
        "is_temporary": dataset.is_temporary,
        "created_at": dataset.created_at.isoformat(),
        "preview": preview,
    }
