from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.db.pending_registrations import PendingRegistration
from app.db.users import User
from app.services.auth_service import AuthService


@pytest.fixture
def mock_user_repo():
    """Create a mock user repository."""
    mock = MagicMock()
    mock.get_by_email = AsyncMock()
    mock.create = AsyncMock()
    return mock


@pytest.fixture
def mock_pending_repo():
    """Create a mock pending registration repository."""
    mock = MagicMock()
    mock.get_by_email = AsyncMock()
    mock.get_by_token = AsyncMock()
    mock.create = AsyncMock()
    mock.delete = AsyncMock()
    return mock


@pytest.fixture
def mock_session(mock_user_repo: MagicMock, mock_pending_repo: MagicMock) -> AsyncMock:
    """Create a mock AsyncSession with repositories."""
    mock = AsyncMock(spec=AsyncSession)
    mock.user_repo = mock_user_repo
    mock.pending_repo = mock_pending_repo
    return mock


@pytest.fixture
def mock_email_sender() -> AsyncMock:
    """Create a mock email sender."""
    return AsyncMock()


@pytest.fixture
def auth_service(mock_session: AsyncMock, mock_email_sender: AsyncMock) -> AuthService:
    """Create an AuthService with mocked dependencies."""
    return AuthService(mock_session, mock_email_sender)


@pytest.mark.asyncio
async def test_signup_success(
    auth_service: AuthService,
    mock_session: AsyncMock,
    mock_email_sender: AsyncMock,
) -> None:
    """Test successful user signup."""
    # Setup - Configure mocks
    mock_session.user_repo.get_by_email.return_value = None
    mock_session.pending_repo.get_by_email.return_value = None
    mock_session.pending_repo.create.return_value = None

    # Execute
    result = await auth_service.signup("test1@example.com", "password123")

    # Assert
    assert result["email"] == "test@example.com"
    assert "Verification email sent" in result["message"]
    mock_email_sender.send_verification_email.assert_awaited_once()


@pytest.mark.asyncio
async def test_signup_already_registered_user(
    auth_service: AuthService, mock_session: AsyncMock
) -> None:
    """Test signup with an already registered email."""
    # Setup
    existing_user = User(email="test@example.com")
    mock_session.user_repo.get_by_email.return_value = existing_user

    # Execute & Assert
    with pytest.raises(ValueError, match="already registered"):
        await auth_service.signup("test@example.com", "password")


@pytest.mark.asyncio
async def test_verify_email_success(
    auth_service: AuthService, mock_session: AsyncMock
) -> None:
    """Test successful email verification."""
    # Setup
    pending = PendingRegistration(
        email="a@b.com",
        hashed_password=hash_password("pw"),
        verification_token="token123",
    )
    mock_session.pending_repo.get_by_token.return_value = pending
    mock_session.user_repo.create.return_value = None
    mock_session.pending_repo.delete.return_value = None

    # Execute
    result = await auth_service.verify_email("token123")

    # Assert
    assert result["message"] == "Email verified. Account created successfully."
    assert "access_token" in result
