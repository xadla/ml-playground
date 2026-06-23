from collections.abc import AsyncGenerator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine, delete
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import settings
from app.core.security import create_access_token, hash_password
from app.db.models import Base
from app.db.users import User
from app.main import create_app


@pytest.fixture(scope="session")
def engine() -> AsyncEngine:
    """Create engine for test database."""
    return create_async_engine(
        settings.TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )


@pytest.fixture(scope="session")
async def create_tables(engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Create all tables before tests run, drop them after."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield  # type: ignore
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(
    engine: AsyncEngine,
    create_tables: AsyncGenerator[AsyncSession, None],
) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session() as session:
        yield session
        await session.rollback()
        await session.close()


@pytest.fixture
def app(db_session: AsyncSession) -> FastAPI:
    """Create FastAPI app with test database session."""
    app = create_app()

    # Override the DB dependency to use our test session
    from app.db.session import get_db

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    # app.state.limiter = limiter
    # app.add_exception_handler(429, _rate_limit_exceeded_handler)

    return app


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create test client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    from app.db.repositories.user import UserRepository

    repo = UserRepository(db_session)
    user = User(
        email="testuser@example.com",
        hashed_password=hash_password("testpassword"),
    )
    await repo.create(user)
    return user


@pytest.fixture
async def auth_client(
    client: AsyncClient,
    test_user: User,
) -> AsyncClient:
    """Authenticated client for protected routes."""
    token = create_access_token({"sub": str(test_user.id)})
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest.fixture(autouse=True)
async def clean_db(db_session: AsyncSession):
    """Clean the users table before each test."""
    await db_session.execute(delete(User))
    await db_session.commit()
    yield
    # Optionally clean up after test too
    await db_session.execute(delete(User))
    await db_session.commit()


# Sync Engine
SYNC_TEST_DB_URL = settings.SYNC_TEST_DB_URL
sync_engine = create_engine(SYNC_TEST_DB_URL, echo=False)
SyncTestSession = sessionmaker(bind=sync_engine, class_=Session)


@pytest.fixture(scope="session", autouse=True)
def create_sync_tables():
    Base.metadata.create_all(sync_engine)
    yield
    Base.metadata.drop_all(sync_engine)


@pytest.fixture
def mock_celery_task(monkeypatch: pytest.MonkeyPatch):
    """Replace run_training.delay with a synchronous execution using test DB."""

    def _sync_execute(experiment_id: str):
        from app.services.ml.runner import execute_training

        db = SyncTestSession()
        try:
            execute_training(db, experiment_id)
        except Exception:
            pass
        finally:
            db.close()

    monkeypatch.setattr(
        "app.services.experiment_service.run_training.delay", _sync_execute
    )
