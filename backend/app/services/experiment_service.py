import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.datasets import Dataset
from app.db.experiments import Experiment
from app.db.repositories.dataset import DatasetRepository
from app.db.repositories.experiment import ExperimentRepository
from app.infrastructure.celery_app import run_training
from app.models.domain.enums import DatasetTypeEnum, ExperimentStatusEnum


class ExperimentService:
    def __init__(self, session: AsyncSession):
        self.exp_repo = ExperimentRepository(session)
        self.dataset_repo = DatasetRepository(session)
        self.session = session
        self.logger = structlog.get_logger(__name__)

    async def create_experiment(
        self,
        dataset_spec: dict[str, Any],
        algorithm: str,
        hyperparameters: dict[str, Any],
        target_column: str,
        user_id: uuid.UUID | None = None,
    ) -> Experiment:
        self.logger.info(
            "experiment.create.start",
            algorithm=algorithm,
            dataset_type=dataset_spec.get("type"),
            user_id=str(user_id) if user_id else None,
            target_column=target_column,
        )

        try:
            # 1. Create dataset record if canvas
            dataset_id = None
            if dataset_spec["type"] == "canvas":
                # Create a dataset with type=canvas and store points in data field
                canvas_dataset = Dataset(
                    name=dataset_spec.get("name", "Canvas Data"),
                    type=DatasetTypeEnum.canvas,
                    data={
                        "points": dataset_spec["points"],
                        "feature_names": dataset_spec.get("feature_names", []),
                    },
                    row_count=len(dataset_spec["points"]),
                    column_names=dataset_spec.get("feature_names", [])
                    + [target_column],
                    is_temporary=True,  # canvas datasets are always temporary
                )
                canvas_dataset = await self.dataset_repo.create(canvas_dataset)
                dataset_id = canvas_dataset.id
            else:
                # uploaded or builtin: use the provided id
                dataset_id = uuid.UUID(dataset_spec["id"])
                # Ensure dataset exists
                ds = await self.dataset_repo.get(dataset_id)
                if not ds:
                    self.logger.warning(
                        "experiment.create.dataset_not_found",
                        dataset_id=str(dataset_id),
                    )
                    raise ValueError("Dataset not found")

            # 2. Create experiment
            experiment = Experiment(
                user_id=user_id,
                dataset_id=dataset_id,
                algorithm=algorithm,
                hyperparameters=hyperparameters,
                target_column=target_column,
                status=ExperimentStatusEnum.pending,
            )
            experiment = await self.exp_repo.create(experiment)

            # 3. Trigger Celery task
            run_training.delay(str(experiment.id))  # type: ignore

            self.logger.info(
                "experiment.create.success",
                experiment_id=str(experiment.id),
                dataset_id=str(dataset_id),
                algorithm=algorithm,
            )

            return experiment

        except ValueError:
            raise
        except Exception as e:
            self.logger.error(
                "experiment.create.failed",
                algorithm=algorithm,
                error=str(e),
                exc_info=True,
            )
            raise

    async def get_experiment(self, experiment_id: uuid.UUID) -> dict[str, Any]:
        self.logger.info(
            "experiment.get.start",
            experiment_id=str(experiment_id),
        )

        try:
            exp = await self.exp_repo.get_with_result(experiment_id)
            if not exp:
                self.logger.warning(
                    "experiment.get.not_found",
                    experiment_id=str(experiment_id),
                )
                raise ValueError("Experiment not found")

            response: dict[str, Any] = {
                "id": str(exp.id),
                "status": exp.status.value
                if hasattr(exp.status, "value")
                else exp.status,
                "algorithm": exp.algorithm,
                "hyperparameters": exp.hyperparameters,
                "dataset_name": exp.dataset.name if exp.dataset else None,
                "dataset_id": str(exp.dataset_id),
                "created_at": exp.created_at.isoformat() if exp.created_at else None,
                "started_at": exp.started_at.isoformat() if exp.started_at else None,
                "completed_at": exp.completed_at.isoformat()
                if exp.completed_at
                else None,
            }

            if exp.status == "completed" and exp.result:
                response["result"] = {
                    "metrics": exp.result.metrics,
                    "confusion_matrix": exp.result.confusion_matrix_data,
                    "plots": exp.result.plot_paths,
                }
            elif exp.status == "failed":
                response["error_message"] = getattr(
                    exp, "error_message", "Unknown error"
                )

            self.logger.info(
                "experiment.get.success",
                experiment_id=str(experiment_id),
                status=exp.status.value if hasattr(exp.status, "value") else exp.status,
            )

            return response

        except ValueError:
            raise
        except Exception as e:
            self.logger.error(
                "experiment.get.failed",
                experiment_id=str(experiment_id),
                error=str(e),
                exc_info=True,
            )
            raise

    async def save_experiment(
        self, experiment_id: uuid.UUID, user_id: uuid.UUID
    ) -> Experiment:
        """Associate an anonymous experiment with a user."""
        self.logger.info(
            "experiment.save.start",
            experiment_id=str(experiment_id),
            user_id=str(user_id),
        )

        try:
            exp = await self.exp_repo.get(experiment_id)
            if not exp:
                self.logger.warning(
                    "experiment.save.not_found",
                    experiment_id=str(experiment_id),
                )
                raise ValueError("Experiment not found")

            if exp.user_id is not None:
                if exp.user_id == user_id:
                    self.logger.warning(
                        "experiment.save.already_saved",
                        experiment_id=str(experiment_id),
                        user_id=str(user_id),
                    )
                    raise ValueError("Experiment already saved")
                else:
                    self.logger.warning(
                        "experiment.save.owned_by_other",
                        experiment_id=str(experiment_id),
                        user_id=str(user_id),
                        owner_id=str(exp.user_id),
                    )
                    raise ValueError("Experiment is owned by another user")

            exp.user_id = user_id
            await self.session.commit()

            self.logger.info(
                "experiment.save.success",
                experiment_id=str(experiment_id),
                user_id=str(user_id),
            )

            return exp

        except ValueError:
            raise
        except Exception as e:
            self.logger.error(
                "experiment.save.failed",
                experiment_id=str(experiment_id),
                user_id=str(user_id),
                error=str(e),
                exc_info=True,
            )
            raise
