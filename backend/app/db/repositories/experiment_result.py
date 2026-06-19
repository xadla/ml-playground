from sqlalchemy.ext.asyncio import AsyncSession

from app.db.experiment_results import ExperimentResult
from app.db.repositories.base import BaseRepository


class ExperimentResultRepository(BaseRepository[ExperimentResult]):
    def __init__(self, session: AsyncSession):
        super().__init__(ExperimentResult, session)
