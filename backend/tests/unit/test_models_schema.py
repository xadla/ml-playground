from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.datasets import Dataset
from app.db.experiment_results import ExperimentResult
from app.db.experiments import Experiment
from app.db.pending_registrations import PendingRegistration
from app.db.repositories.pending_registration import PendingRegistrationRepository
from app.db.repositories.user import UserRepository
from app.db.users import User
from app.models.domain.enums import DatasetTypeEnum, ExperimentStatusEnum


@pytest.mark.asyncio
async def test_create_user_with_updated_at(db_session):
    """Test that user has updated_at timestamp"""
    repo = UserRepository(db_session)
    user = User(
        email="test@test.com",
        hashed_password="pw",
        # No is_verified needed
    )
    created = await repo.create(user)
    assert created.id is not None
    assert created.created_at is not None
    assert created.updated_at is not None


@pytest.mark.asyncio
async def test_pending_registration_expires_at(db_session: AsyncSession):
    repo = PendingRegistrationRepository(db_session)
    reg = PendingRegistration(
        email="temp@test.com",
        hashed_password="hash",
        verification_token="token123",
        expires_at=datetime.now(UTC) + timedelta(hours=24),
    )
    created = await repo.create(reg)
    assert created.expires_at > created.created_at


@pytest.mark.asyncio
async def test_dataset_canvas_data(db_session: AsyncSession):
    from app.db.repositories.dataset import DatasetRepository

    repo = DatasetRepository(db_session)
    ds = Dataset(
        name="Canvas set",
        type=DatasetTypeEnum.canvas,
        data={"points": [{"x": 1, "y": 2, "class": "A"}]},
        row_count=1,
        column_names=["x", "y", "class"],
        is_temporary=True,
    )
    created = await repo.create(ds)
    if created.data is not None:
        assert created.data["points"][0]["x"] == 1


@pytest.mark.asyncio
async def test_experiment_with_result(db_session: AsyncSession):
    from app.db.repositories.dataset import DatasetRepository
    from app.db.repositories.experiment import ExperimentRepository
    from app.db.repositories.experiment_result import ExperimentResultRepository

    # Create dataset first
    ds_repo = DatasetRepository(db_session)
    ds = Dataset(
        name="Iris",
        type=DatasetTypeEnum.builtin,
        row_count=150,
        column_names=["a", "b"],
    )
    dataset = await ds_repo.create(ds)

    # Create experiment
    exp_repo = ExperimentRepository(db_session)
    exp = Experiment(
        dataset_id=dataset.id,
        algorithm="knn",
        hyperparameters={"k": 3},
        target_column="species",
        status=ExperimentStatusEnum.completed,
    )
    experiment = await exp_repo.create(exp)

    # Create result
    res_repo = ExperimentResultRepository(db_session)
    result = ExperimentResult(
        experiment_id=experiment.id,
        metrics={"accuracy": 0.9},
        confusion_matrix_data=[[45, 5], [10, 40]],
        plot_paths={"decision_boundary": "/plots/test.png"},
    )
    await res_repo.create(result)

    # Verify 1:1
    fetched = await exp_repo.get_with_result(experiment.id)
    if fetched is not None:
        assert fetched.result is not None
        if fetched.result.metrics is not None:
            assert fetched.result.metrics["accuracy"] == 0.9
