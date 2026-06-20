import csv
import os
import uuid
from io import StringIO
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.datasets import Dataset
from app.db.repositories.dataset import DatasetRepository
from app.models.domain.enums import DatasetTypeEnum

# Built-in dataset definitions (could be moved to a config file later)
BUILTIN_DATASETS: list[dict[str, Any]] = [
    {
        "id": "builtin_iris",
        "name": "Iris",
        "description": "Classic flower species classification dataset with 3 classes.",
        "row_count": 150,
        "column_names": [
            "sepal_length",
            "sepal_width",
            "petal_length",
            "petal_width",
            "species",
        ],
    },
    # Add more built‑ins here in the future
]


class DatasetService:
    def __init__(self, session: AsyncSession):
        self.repo = DatasetRepository(session)
        self.session = session

    def list_builtin_datasets(self) -> list[dict[str, Any]]:
        """Return the list of built‑in datasets (no DB required)."""
        return BUILTIN_DATASETS

    async def upload_csv(
        self,
        file_content: bytes,
        filename: str,
        user_id: uuid.UUID | None = None,
    ) -> tuple[Dataset, list[dict[str, Any]]]:
        # 1. Check file size (max 5 MB)
        max_size = 5 * 1024 * 1024  # 5 MB
        if len(file_content) > max_size:
            raise ValueError("File size exceeds 5 MB limit")

        # 2. Parse CSV to extract metadata and preview
        try:
            content_str = file_content.decode("utf-8")
        except UnicodeDecodeError as err:
            raise ValueError("File is not a valid UTF-8 CSV") from err

        try:
            reader = csv.DictReader(StringIO(content_str))
            rows = list(reader)
        except csv.Error as err:
            raise ValueError("Invalid CSV format") from err

        if not rows:
            raise ValueError("CSV file is empty")

        column_names = list(rows[0].keys())
        row_count = len(rows)
        preview = rows[:5]  # first 5 rows

        # 3. Save file to disk
        file_ext = os.path.splitext(filename)[1] or ".csv"
        stored_name = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, stored_name)
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        with open(file_path, "wb") as f:
            f.write(file_content)

        # 4. Create database record
        dataset = Dataset(
            user_id=user_id,
            name=filename,
            type=DatasetTypeEnum.uploaded,
            file_path=file_path,
            original_filename=filename,
            row_count=row_count,
            column_names=column_names,
            is_temporary=True,  # anonymous uploads are temporary
        )
        dataset = await self.repo.create(dataset)
        return dataset, preview
