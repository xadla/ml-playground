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
            .options(selectinload(Experiment.result))
            .where(Experiment.id == experiment_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: UUID, page: int = 1, limit: int = 20
    ) -> list[Experiment]:
        stmt = (
            select(Experiment)
            .options(selectinload(Experiment.result))
            .where(Experiment.user_id == user_id)
            .order_by(Experiment.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_by_user(self, user_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Experiment)
            .where(Experiment.user_id == user_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()
