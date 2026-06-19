import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.user import UserRepository
from app.db.users import User


@pytest.mark.asyncio
async def test_create_user(db_session: AsyncSession):
    repo = UserRepository(db_session)
    user = User(email="test@example.com", hashed_password="secret")
    created = await repo.create(user)
    assert created.id is not None

    fetched: User = await repo.get(created.id)  # type: ignore
    assert fetched.email == "test@example.com"


@pytest.mark.asyncio
async def test_get_user_by_email(db_session: AsyncSession):
    repo = UserRepository(db_session)
    user = User(email="a@b.com", hashed_password="x")
    await repo.create(user)
    result = await repo.get_by_email("a@b.com")
    assert result is not None
    assert result.email == "a@b.com"
