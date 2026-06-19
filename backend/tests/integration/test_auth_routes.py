import pytest
from httpx import AsyncClient

from app.db.users import User


@pytest.mark.asyncio
async def test_signup_202(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/signup",
        json={"email": "newuser@example.com", "password": "secure1234"},
    )
    assert resp.status_code == 202
    data = resp.json()
    assert data["email"] == "newuser@example.com"


@pytest.mark.asyncio
async def test_signup_duplicate_pending(client: AsyncClient):
    # First signup
    await client.post(
        "/api/v1/auth/signup", json={"email": "dup@test.com", "password": "12345678"}
    )
    # Second signup with same email should be 409
    resp = await client.post(
        "/api/v1/auth/signup", json={"email": "dup@test.com", "password": "12345678"}
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: User):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "testpassword"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_login_invalid(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "testuser@example.com", "password": "wrong"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_get_me(auth_client: AsyncClient):
    resp = await auth_client.get("/api/v1/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "testuser@example.com"
