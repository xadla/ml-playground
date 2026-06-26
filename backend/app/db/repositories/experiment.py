from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.experiments import Experiment
from app.db.repositories.base import BaseRepository


class ExperimentRepository(BaseRepository[Experiment]):
    def __init__(self, session: AsyncSession):
        super().__init__(Experiment, session)

    async def get_with_result(self, experiment_id: UUID) -> Experiment | None:
        stmt = (
            select(Experiment)
            .options(selectinload(Experiment.result), selectinload(Experiment.dataset))
            .where(Experiment.id == experiment_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_by_user(self, user_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Experiment)
            .where(Experiment.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def list_by_user(
        self,
        user_id: UUID,
        page: int = 1,
        limit: int = 20,
        sort_by: str = "created_at",
        order: str = "desc",
    ) -> tuple[list[Experiment], int]:
        # Build query
        stmt = select(Experiment).options(
            selectinload(Experiment.result), selectinload(Experiment.dataset)
        )

        # Count total (separate query)
        count_stmt = (
            select(func.count())
            .select_from(Experiment)
            .where(Experiment.user_id == user_id)
        )
        total_result = await self.session.execute(count_stmt)
        total = total_result.scalar_one()

        stmt = stmt.where(Experiment.user_id == user_id)

        # Sorting
        if sort_by == "created_at":
            col = Experiment.created_at
        # elif sort_by == "algorithm":
        #     col = Experiment.algorithm
        else:
            col = Experiment.created_at

        if order == "desc":
            stmt = stmt.order_by(col.desc())
        else:
            stmt = stmt.order_by(col.asc())

        stmt = stmt.offset((page - 1) * limit).limit(limit)
        result = await self.session.execute(stmt)
        experiments = list(result.scalars().all())
        return experiments, total
