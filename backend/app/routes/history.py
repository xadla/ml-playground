import uuid
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.db.users import User
from app.models.response.history import (
    CompareResponse,
    HistoryItemResponse,
    HistoryListResponse,
)
from app.services.history_service import HistoryService
from app.utils.rate_limit import limiter

router = APIRouter(prefix="/history", tags=["history"])


def get_history_service(db: Annotated[AsyncSession, Depends(get_db)]) -> HistoryService:
    return HistoryService(db)


@router.get("", response_model=HistoryListResponse)
@limiter.limit("60/minute")  # type: ignore
async def list_history(
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HistoryService, Depends(get_history_service)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort_by: str = Query("created_at", regex="^(created_at|algorithm|metric)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
):
    result = await service.list_history(
        user_id=current_user.id,
        page=page,
        limit=limit,
        sort_by=sort_by,
        order=order,
    )
    return result


@router.get("/{experiment_id}", response_model=HistoryItemResponse)
@limiter.limit("60/minute")  # type: ignore
async def get_history_experiment(
    request: Request,
    experiment_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HistoryService, Depends(get_history_service)],
):
    try:
        experiment = await service.get_experiment(current_user.id, experiment_id)
        # experiment is a dict, access with keys
        return HistoryItemResponse(
            id=str(experiment["id"]),
            dataset_name=experiment["dataset_name"],
            dataset_id=str(experiment["dataset_id"])
            if experiment.get("dataset_id")
            else None,
            algorithm=experiment["algorithm"],
            hyperparameters=experiment["hyperparameters"],
            status=experiment["status"]
            if isinstance(experiment["status"], str)
            else experiment["status"].value,
            top_metric=experiment.get("top_metric"),
            metrics=experiment.get("metrics"),
            created_at=experiment["created_at"],
            started_at=experiment.get("started_at"),
            completed_at=experiment.get("completed_at"),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Experiment not found") from e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail="Access denied") from e
    except KeyError as e:
        raise HTTPException(status_code=500, detail=f"Missing field: {e}") from e


@router.delete("/{experiment_id}", status_code=204)
@limiter.limit("60/minute")  # type: ignore
async def delete_history_experiment(
    request: Request,
    experiment_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HistoryService, Depends(get_history_service)],
):
    try:
        await service.delete_experiment(current_user.id, experiment_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail="Experiment not found") from e
    except PermissionError as e:
        raise HTTPException(status_code=403, detail="Access denied") from e


@router.post("/compare", response_model=CompareResponse)
@limiter.limit("60/minute")  # type: ignore
async def compare_experiments(
    request: Request,
    request_data: dict[str, Any],
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[HistoryService, Depends(get_history_service)],
):
    try:
        from app.models.request.history import CompareRequest

        body = CompareRequest(**request_data)
    except Exception as e:
        raise HTTPException(400, detail="Invalid request body") from e

    try:
        experiments = await service.compare_experiments(
            user_id=current_user.id,
            experiment_ids=[uuid.UUID(id) for id in body.experiment_ids],
        )

        # Map each experiment dictionary to HistoryItemResponse
        mapped_experiments = []
        for exp in experiments:  # exp is a dict
            mapped_exp = HistoryItemResponse(
                id=str(exp["id"]),
                dataset_name=exp["dataset_name"],
                dataset_id=str(exp["dataset_id"]) if exp.get("dataset_id") else None,
                algorithm=exp["algorithm"],
                hyperparameters=exp["hyperparameters"],
                status=exp["status"]
                if isinstance(exp["status"], str)
                else exp["status"].value,
                top_metric=exp.get("top_metric"),
                metrics=exp.get("metrics"),
                created_at=exp["created_at"],
                started_at=exp.get("started_at"),
                completed_at=exp.get("completed_at"),
            )
            mapped_experiments.append(mapped_exp)

        return CompareResponse(experiments=mapped_experiments)
    except ValueError as e:
        raise HTTPException(400, detail=str(e)) from e
    except PermissionError as e:
        raise HTTPException(403, detail=str(e)) from e
    except KeyError as e:
        raise HTTPException(500, detail=f"Missing field in experiment data: {e}") from e
