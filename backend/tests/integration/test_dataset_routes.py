import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_builtin_datasets(client: AsyncClient):
    resp = await client.get("/api/v1/datasets/builtin")
    assert resp.status_code == 200
    data = resp.json()
    assert "datasets" in data
    assert len(data["datasets"]) > 0


@pytest.mark.asyncio
async def test_upload_csv_success(client: AsyncClient, tmp_path, monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "UPLOAD_DIR", str(tmp_path))

    csv_content = "col1,col2\nval1,val2\nval3,val4"
    files = {"file": ("data.csv", csv_content, "text/csv")}
    resp = await client.post("/api/v1/datasets/upload", files=files)
    assert resp.status_code == 201
    data = resp.json()
    assert data["row_count"] == 2
    assert data["column_names"] == ["col1", "col2"]
    assert len(data["preview"]) == 2
    assert data["is_temporary"] is True


@pytest.mark.asyncio
async def test_upload_no_file(client: AsyncClient):
    resp = await client.post("/api/v1/datasets/upload")
    assert (
        resp.status_code == 422
    )  # FastAPI validation error for missing required field


@pytest.mark.asyncio
async def test_upload_empty_csv(client: AsyncClient):
    csv_content = ""
    files = {"file": ("empty.csv", csv_content, "text/csv")}
    resp = await client.post("/api/v1/datasets/upload", files=files)
    assert resp.status_code == 422  # Unprocessable due to empty


@pytest.mark.asyncio
async def test_upload_invalid_csv(client: AsyncClient):
    csv_content = b"\x89PNG\r\n\x1a\n\x00\x00..."  # fake binary
    files = {"file": ("fake.png", csv_content, "image/png")}
    resp = await client.post("/api/v1/datasets/upload", files=files)
    # We check content type first -> 400, or if it passes, parsing will fail -> 422
    assert resp.status_code in (400, 422)
