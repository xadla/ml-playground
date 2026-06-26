import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_404_not_found(client: AsyncClient):
    resp = await client.get("/api/v1/nonexistent")
    assert resp.status_code == 404
    body = resp.json()
    assert "error" in body
    assert body["error"]["code"] == "NOT_FOUND"


@pytest.mark.asyncio
async def test_422_validation_error(client: AsyncClient):
    resp = await client.post("/api/v1/auth/signup", json={"email": "notanemail"})
    assert resp.status_code == 422
    body = resp.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert "details" in body["error"]


@pytest.mark.asyncio
async def test_401_unauthorized(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    body = resp.json()
    assert body["error"]["code"] == "UNAUTHORIZED"


@pytest.mark.asyncio
async def test_409_conflict(client: AsyncClient):
    # Duplicate signup
    await client.post(
        "/api/v1/auth/signup", json={"email": "dup@test.com", "password": "12345678"}
    )
    resp = await client.post(
        "/api/v1/auth/signup", json={"email": "dup@test.com", "password": "12345678"}
    )
    assert resp.status_code == 409
    body = resp.json()
    assert body["error"]["code"] == "CONFLICT"
