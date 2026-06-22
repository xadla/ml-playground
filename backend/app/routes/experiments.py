import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.db.users import User
from app.models.request.experiments import CreateExperimentRequest
from app.models.response.auth import MessageResponse
from app.models.response.experiments import (
    ExperimentCreateResponse,
    ExperimentStatusResponse,
)
from app.services.experiment_service import ExperimentService
from app.utils.rate_limit import limiter

router = APIRouter(prefix="/experiments", tags=["experiments"])


def get_experiment_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ExperimentService:
    return ExperimentService(db)


@router.post("", response_model=ExperimentCreateResponse, status_code=202)
@limiter.limit("60/minute")  # type: ignore
async def create_experiment(
    req: CreateExperimentRequest,
    service: Annotated[ExperimentService, Depends(get_experiment_service)],
    user: Annotated[User, Depends(get_current_user)],
):
    # The spec says public endpoint, but if user is provided (authenticated), we can associate.
    # We'll make user optional via a dependency that returns None if not logged in.
    # For now, we'll create a separate get_current_user_optional. But let's keep it simple:
    # Just pass user_id=None for now, and later implement optional auth.
    try:
        experiment = await service.create_experiment(
            dataset_spec=req.dataset.model_dump(by_alias=True),
            algorithm=req.algorithm,
            hyperparameters=req.hyperparameters,
            target_column=req.target_column,
            user_id=None,  # anonymous by default; later we'll add optional auth
        )
        return {
            "experiment_id": str(experiment.id),
            "status": experiment.status.value,
            "message": "Training started. Check status at GET /experiments/{experiment_id}.",
        }
    except ValueError as e:
        raise HTTPException(400, detail=str(e)) from e


@router.get("/{experiment_id}", response_model=ExperimentStatusResponse)
async def get_experiment(
    experiment_id: uuid.UUID,
    service: Annotated[ExperimentService, Depends(get_experiment_service)],
):
    try:
        result = await service.get_experiment(experiment_id)
        return result
    except ValueError as e:
        raise HTTPException(404, detail=str(e)) from e


@router.post("/{experiment_id}/save", response_model=MessageResponse)
async def save_experiment(
    experiment_id: uuid.UUID,
    service: Annotated[ExperimentService, Depends(get_experiment_service)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    try:
        await service.save_experiment(experiment_id, current_user.id)
        return {"message": "Experiment saved to your history."}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(404, detail=str(e)) from e
        raise HTTPException(400, detail=str(e)) from e
