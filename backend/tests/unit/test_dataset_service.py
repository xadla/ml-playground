from unittest.mock import AsyncMock, MagicMock

import pytest

from app.db.datasets import Dataset
from app.models.domain.enums import DatasetTypeEnum
from app.services.dataset_service import DatasetService


@pytest.fixture
def mock_session():
    return AsyncMock()


@pytest.fixture
def dataset_service(mock_session: MagicMock):
    return DatasetService(mock_session)


def test_list_builtin_datasets(dataset_service: DatasetService):
    datasets = dataset_service.list_builtin_datasets()
    assert isinstance(datasets, list)
    assert any(d["id"] == "builtin_iris" for d in datasets)


@pytest.mark.asyncio
async def test_upload_csv_valid(dataset_service: DatasetService, tmp_path, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))

    # Create a mock repository
    mock_repo = AsyncMock()
    mock_repo.create = AsyncMock(
        return_value=Dataset(
            name="test.csv",
            type=DatasetTypeEnum.uploaded,
            row_count=2,
            column_names=["a", "b"],
            is_temporary=True,
        )
    )

    dataset_service.repo = mock_repo

    csv_content = b"a,b\n1,2\n3,4"
    dataset, preview = await dataset_service.upload_csv(
        file_content=csv_content,
        filename="test.csv",
    )

    assert dataset.name == "test.csv"
    assert len(preview) == 2
    assert preview[0]["a"] == "1"
    dataset_service.repo.create.assert_awaited_once()

    import os

    uploaded_files = os.listdir(tmp_path)
    assert len(uploaded_files) == 1


@pytest.mark.asyncio
async def test_upload_csv_size_exceeded(dataset_service: DatasetService):
    csv_content = b"a,b\n1,2\n" * 1000000  # make it large
    with pytest.raises(ValueError, match="File size exceeds 5 MB limit"):
        await dataset_service.upload_csv(csv_content, "big.csv")


@pytest.mark.asyncio
async def test_upload_csv_invalid_format(dataset_service: DatasetService):
    csv_content = b"this is not csv"
    with pytest.raises(ValueError, match="CSV file is empty"):
        await dataset_service.upload_csv(csv_content, "bad.csv")
