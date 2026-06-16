import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.config import settings
from app.db.models import Base
from app.main import create_app


@pytest.fixture(scope="session")
def engine():
    """Create engine for test database"""
    return create_async_engine(
        settings.TEST_DATABASE_URL,
        echo=False,
        poolclass=NullPool,
    )


@pytest.fixture(scope="session")
async def create_tables(engine: AsyncEngine):
    """Create all tables before tests run, drop them after"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(engine: AsyncEngine, create_tables):
    """
    Create a fresh database session for each test.
    FIX: Removed nested session.begin() to avoid transaction issues.
    """
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False,
    )

    async with async_session() as session:
        yield session
        # Rollback after test to keep state clean
        await session.rollback()
        await session.close()


@pytest.fixture
def app(db_session: AsyncSession):
    """Create FastAPI app with test database session"""
    app = create_app()

    # Override the DB dependency to use our test session
    from app.db.session import get_db

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(429, _rate_limit_exceeded_handler)  # type: ignore

    return app


@pytest.fixture
async def client(app: FastAPI):
    """Create test client"""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
