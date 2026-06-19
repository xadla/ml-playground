from sqlalchemy.ext.asyncio import AsyncSession

from app.db.datasets import Dataset
from app.db.repositories.base import BaseRepository


class DatasetRepository(BaseRepository[Dataset]):
    def __init__(self, session: AsyncSession):
        super().__init__(Dataset, session)
