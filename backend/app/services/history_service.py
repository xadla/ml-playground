import uuid
from typing import Any

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.experiments import Experiment
from app.db.repositories.experiment import ExperimentRepository


class HistoryService:
    def __init__(self, session: AsyncSession):
        self.exp_repo = ExperimentRepository(session)
        self.session = session
        self.logger = structlog.get_logger(__name__)

    async def list_history(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        limit: int = 20,
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> dict[str, Any]:
        self.logger.info(
            "history.list.start",
            user_id=str(user_id),
            page=page,
            limit=limit,
            sort_by=sort_by,
            order=order,
        )

        try:
            # For now, we ignore metric sorting; fall back to created_at
            allowed_sort = ["created_at", "algorithm", "metric"]
            if sort_by not in allowed_sort:
                sort_by = "created_at"
            if sort_by == "metric":
                # metric sorting not implemented in DB; default to created_at for now
                sort_by = "created_at"

            experiments: list[Experiment]
            total: int

            experiments, total = await self.exp_repo.list_by_user(
                user_id=user_id,
                page=page,
                limit=limit,
                sort_by=sort_by,
                order=order,
            )

            items: list[dict[str, Any]] = []
            for exp in experiments:
                top_metric: dict[str, Any] | None = None
                if exp.result and exp.result.metrics:
                    # pick accuracy as top metric if available, else first key
                    metric_name = (
                        "accuracy"
                        if "accuracy" in exp.result.metrics
                        else next(iter(exp.result.metrics))
                    )
                    top_metric = {
                        "name": metric_name,
                        "value": exp.result.metrics[metric_name],
                    }
                items.append(  # type: ignore
                    {
                        "id": str(exp.id),
                        "dataset_name": exp.dataset.name if exp.dataset else "",
                        "algorithm": exp.algorithm,
                        "hyperparameters": exp.hyperparameters,
                        "status": exp.status,
                        "top_metric": top_metric,
                        "created_at": exp.created_at.isoformat()
                        if exp.created_at
                        else None,
                    }
                )

            self.logger.info(
                "history.list.success",
                user_id=str(user_id),
                total=total,
                items_returned=len(items),
                page=page,
                limit=limit,
            )

            return {
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
            }

        except Exception as e:
            self.logger.error(
                "history.list.failed",
                user_id=str(user_id),
                error=str(e),
                exc_info=True,
            )
            raise

    async def get_experiment(
        self, user_id: uuid.UUID, experiment_id: uuid.UUID
    ) -> dict[str, Any]:
        self.logger.info(
            "history.get.start",
            user_id=str(user_id),
            experiment_id=str(experiment_id),
        )

        try:
            exp = await self.exp_repo.get_with_result(experiment_id)
            if not exp:
                self.logger.warning(
                    "history.get.not_found",
                    experiment_id=str(experiment_id),
                )
                raise ValueError("Experiment not found")
            if exp.user_id != user_id:
                self.logger.warning(
                    "history.get.access_denied",
                    experiment_id=str(experiment_id),
                    user_id=str(user_id),
                    owner_id=str(exp.user_id),
                )
                raise PermissionError("You do not have access to this experiment")

            # Reuse the same response structure as the experiment status endpoint
            # from app.services.experiment_service import ExperimentService
            # We'll use a method from ExperimentService to build the full dict, or duplicate the building
            # Better to have a shared builder function.
            # For now, inline it.
            result_dict: dict[str, Any] = {
                "id": str(exp.id),
                "status": exp.status,
                "algorithm": exp.algorithm,
                "hyperparameters": exp.hyperparameters,
                "dataset_name": exp.dataset.name if exp.dataset else None,
                "dataset_id": str(exp.dataset_id) if exp.dataset_id else None,
                "created_at": exp.created_at.isoformat() if exp.created_at else None,
                "started_at": exp.started_at.isoformat() if exp.started_at else None,
                "completed_at": exp.completed_at.isoformat()
                if exp.completed_at
                else None,
            }
            if exp.status == "completed" and exp.result:
                result_dict["result"] = {
                    "metrics": exp.result.metrics,
                    "confusion_matrix": exp.result.confusion_matrix_data,
                    "plots": exp.result.plot_paths,
                }
            elif exp.status == "failed":
                result_dict["error_message"] = getattr(exp, "error_message", None)

            self.logger.info(
                "history.get.success",
                experiment_id=str(experiment_id),
                user_id=str(user_id),
                status=exp.status,
            )

            return result_dict

        except (ValueError, PermissionError):
            raise
        except Exception as e:
            self.logger.error(
                "history.get.failed",
                experiment_id=str(experiment_id),
                user_id=str(user_id),
                error=str(e),
                exc_info=True,
            )
            raise

    async def delete_experiment(self, user_id: uuid.UUID, experiment_id: uuid.UUID):
        self.logger.info(
            "history.delete.start",
            user_id=str(user_id),
            experiment_id=str(experiment_id),
        )

        try:
            exp = await self.exp_repo.get(experiment_id)
            if not exp:
                self.logger.warning(
                    "history.delete.not_found",
                    experiment_id=str(experiment_id),
                )
                raise ValueError("Experiment not found")
            if exp.user_id != user_id:
                self.logger.warning(
                    "history.delete.access_denied",
                    experiment_id=str(experiment_id),
                    user_id=str(user_id),
                    owner_id=str(exp.user_id),
                )
                raise PermissionError("You do not have access to this experiment")

            await self.exp_repo.delete(exp)

            self.logger.info(
                "history.delete.success",
                experiment_id=str(experiment_id),
                user_id=str(user_id),
            )

        except (ValueError, PermissionError):
            raise
        except Exception as e:
            self.logger.error(
                "history.delete.failed",
                experiment_id=str(experiment_id),
                user_id=str(user_id),
                error=str(e),
                exc_info=True,
            )
            raise

    async def compare_experiments(
        self, user_id: uuid.UUID, experiment_ids: list[uuid.UUID]
    ) -> list[dict[str, Any]]:
        self.logger.info(
            "history.compare.start",
            user_id=str(user_id),
            experiment_count=len(experiment_ids),
            experiment_ids=[str(eid) for eid in experiment_ids],
        )

        try:
            if len(experiment_ids) < 2:
                self.logger.warning(
                    "history.compare.insufficient_ids",
                    count=len(experiment_ids),
                )
                raise ValueError("At least 2 experiment IDs are required")

            experiments: list[dict[str, Any]] = []
            for eid in experiment_ids:
                exp = await self.exp_repo.get_with_result(eid)
                if not exp:
                    self.logger.warning(
                        "history.compare.experiment_not_found",
                        experiment_id=str(eid),
                    )
                    raise ValueError(f"Experiment {eid} not found")
                if exp.user_id != user_id:
                    self.logger.warning(
                        "history.compare.access_denied",
                        experiment_id=str(eid),
                        user_id=str(user_id),
                        owner_id=str(exp.user_id),
                    )
                    raise PermissionError(f"You do not have access to experiment {eid}")
                experiments.append(
                    {
                        "id": str(exp.id),
                        "dataset_name": exp.dataset.name if exp.dataset else None,
                        "algorithm": exp.algorithm,
                        "hyperparameters": exp.hyperparameters,
                        "metrics": exp.result.metrics if exp.result else None,
                        "created_at": exp.created_at.isoformat()
                        if exp.created_at
                        else None,
                    }
                )

            self.logger.info(
                "history.compare.success",
                user_id=str(user_id),
                experiment_count=len(experiments),
            )

            return experiments

        except (ValueError, PermissionError):
            raise
        except Exception as e:
            self.logger.error(
                "history.compare.failed",
                user_id=str(user_id),
                error=str(e),
                exc_info=True,
            )
            raise
