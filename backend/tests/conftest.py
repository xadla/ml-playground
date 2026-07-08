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
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from starlette.testclient import TestClient

from app.config import settings
from app.core.security import create_access_token, hash_password
from app.db.datasets import Dataset
from app.db.experiments import Experiment
from app.db.models import Base
from app.db.repositories import DatasetRepository, ExperimentRepository
from app.db.users import User
from app.main import create_app
from app.models.domain.enums import DatasetTypeEnum

# ============================================
# DATABASE ENGINES
# ============================================


# Async engine for integration tests
@pytest.fixture(scope="session")
def engine() -> AsyncEngine:
    """Create async engine for integration tests."""
    return create_async_engine(
        settings.TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )


# Sync engine for contract tests
@pytest.fixture(scope="session")
def sync_engine():
    """Create sync engine for contract tests and cleanup."""
    return create_engine(settings.SYNC_TEST_DB_URL, echo=False)


# ============================================
# DATABASE SETUP
# ============================================


# For integration tests (async)
@pytest.fixture(scope="session", autouse=True)
async def create_tables(engine: AsyncEngine) -> AsyncGenerator[None, None]:
    """Create all tables for integration tests."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


# For contract tests (sync)
@pytest.fixture(scope="session", autouse=True)
def create_sync_tables(sync_engine):
    """Create all tables for contract tests."""
    Base.metadata.create_all(sync_engine)
    yield
    Base.metadata.drop_all(sync_engine)


# ============================================
# ASYNC FIXTURES (For Integration Tests)
# ============================================


@pytest.fixture
async def db_session(
    engine: AsyncEngine,
) -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for integration tests."""
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
    """Create FastAPI app with async database session for integration tests."""
    app = create_app()

    # Override the DB dependency to use our test session
    from app.db.session import get_db

    async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    return app


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create async test client for integration tests."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


# ============================================
# SYNC FIXTURES (For Contract Tests)
# ============================================


@pytest.fixture
def sync_db_session(sync_engine):
    """Create a sync database session for contract tests."""
    session_local = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)
    session = session_local()
    try:
        yield session
        session.rollback()
    finally:
        session.close()


@pytest.fixture
def sync_app(sync_db_session) -> FastAPI:
    """Create FastAPI app with sync database session for contract tests."""
    app = create_app()

    # Override the DB dependency to use sync session
    from app.db.session import get_db

    def override_get_db():
        yield sync_db_session

    app.dependency_overrides[get_db] = override_get_db

    return app


@pytest.fixture
def sync_client(sync_app: FastAPI):
    """Create sync test client for contract tests."""
    with TestClient(sync_app, base_url="http://test") as client:
        yield client


# ============================================
# CLEANUP
# ============================================


# Clean for integration tests (async)
@pytest.fixture(autouse=True)
async def clean_db(db_session: AsyncSession):
    """Clean database before and after integration tests."""
    # Clean before test
    await db_session.execute(delete(User))
    await db_session.execute(delete(Dataset))
    await db_session.execute(delete(Experiment))
    await db_session.commit()
    yield
    # Clean after test
    await db_session.execute(delete(User))
    await db_session.execute(delete(Dataset))
    await db_session.execute(delete(Experiment))
    await db_session.commit()


# Clean for contract tests (sync) - NOT autouse, only when requested
@pytest.fixture
def clean_sync_db(sync_db_session):
    """Clean database before and after contract tests."""
    # Clean before test
    sync_db_session.execute(delete(User))
    sync_db_session.execute(delete(Dataset))
    sync_db_session.execute(delete(Experiment))
    sync_db_session.commit()
    yield
    # Clean after test
    sync_db_session.execute(delete(User))
    sync_db_session.execute(delete(Dataset))
    sync_db_session.execute(delete(Experiment))
    sync_db_session.commit()


# ============================================
# USER FIXTURES
# ============================================


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user for integration tests."""
    from app.db.repositories.user import UserRepository

    repo = UserRepository(db_session)
    user = User(
        email="testuser@example.com",
        hashed_password=hash_password("testpassword"),
    )
    created_user = await repo.create(user)
    await db_session.commit()
    return created_user


@pytest.fixture
def sync_test_user(sync_db_session) -> User:
    """Create a test user for contract tests."""
    user = User(
        email="testuser@example.com",
        hashed_password=hash_password("testpassword"),
    )
    sync_db_session.add(user)
    sync_db_session.commit()
    sync_db_session.refresh(user)
    return user


@pytest.fixture
async def auth_client(
    client: AsyncClient,
    test_user: User,
) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client for integration tests."""
    token = create_access_token({"sub": str(test_user.id)})
    client.headers["Authorization"] = f"Bearer {token}"
    yield client


@pytest.fixture
def sync_auth_client(
    sync_client: TestClient,
    sync_test_user: User,
) -> TestClient:
    """Authenticated client for contract tests."""
    token = create_access_token({"sub": str(sync_test_user.id)})
    sync_client.headers["Authorization"] = f"Bearer {token}"
    return sync_client


# ============================================
# EXPERIMENT FIXTURES
# ============================================


@pytest.fixture
async def test_user_with_experiments(db_session: AsyncSession, test_user: User) -> User:
    """Create a test user with experiments for integration tests."""
    ds_repo = DatasetRepository(db_session)
    ds = Dataset(
        name="test_ds",
        type=DatasetTypeEnum.canvas,
        data={"points": [{"x": 1, "y": 2, "class": "A"}]},
        row_count=1,
        column_names=["x", "y", "class"],
        is_temporary=True,
    )
    await ds_repo.create(ds)
    await db_session.commit()

    exp_repo = ExperimentRepository(db_session)
    for _ in range(3):
        exp = Experiment(
            user_id=test_user.id,
            dataset_id=ds.id,
            algorithm="knn",
            hyperparameters={"k": 3},
            target_column="class",
            status="completed",
        )
        await exp_repo.create(exp)

    await db_session.commit()
    return test_user


# ============================================
# CELERY MOCK
# ============================================


@pytest.fixture
def mock_celery_task(monkeypatch: pytest.MonkeyPatch, sync_engine):
    """Replace run_training.delay with synchronous execution using test DB."""

    sync_test_session = sessionmaker(bind=sync_engine)

    def _sync_execute(experiment_id: str):
        from app.services.ml.runner import execute_training

        db = sync_test_session()
        try:
            execute_training(db, experiment_id)
        except Exception:
            pass
        finally:
            db.close()

    monkeypatch.setattr(
        "app.services.experiment_service.run_training.delay", _sync_execute
    )
