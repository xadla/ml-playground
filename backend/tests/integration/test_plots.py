import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_plot_success(client: AsyncClient, tmp_path, monkeypatch):
    # Override PLOT_DIR with a temporary directory
    monkeypatch.setattr("app.config.settings.PLOT_DIR", str(tmp_path))

    # Create a dummy PNG file
    plot_filename = "test_plot.png"
    file_path = tmp_path / plot_filename
    file_path.write_bytes(b"\x89PNG\r\n\x1a\n")  # minimal PNG header

    resp = await client.get(f"/api/v1/plots/{plot_filename}")
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"


@pytest.mark.asyncio
async def test_get_plot_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/plots/nonexistent.png")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_plot_directory_traversal(client: AsyncClient):
    resp = await client.get("/api/v1/plots/../../../etc/passwd")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_get_plot_non_png(client: AsyncClient):
    resp = await client.get("/api/v1/plots/test.jpg")
    assert resp.status_code == 404
