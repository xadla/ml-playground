from datetime import UTC, datetime, timedelta
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
    service = AuthService(mock_session, mock_email_sender)
    service.user_repo = mock_session.user_repo
    service.pending_repo = mock_session.pending_repo
    return service


@pytest.mark.asyncio
async def test_signup_success(
    auth_service: AuthService,
    mock_session: AsyncMock,
    mock_email_sender: AsyncMock,
) -> None:
    """Test successful user signup."""
    # Setup - Configure mocks
    email = "test@example.com"
    auth_service.user_repo.get_by_email.return_value = None  # type: ignore
    auth_service.pending_repo.get_by_email.return_value = None  # type: ignore
    auth_service.pending_repo.create.return_value = None  # type: ignore

    # Execute
    result = await auth_service.signup(email, "password123")

    # Assert
    assert result["email"] == email
    assert "Verification email sent" in result["message"]
    mock_email_sender.send_verification_email.assert_awaited_once()


@pytest.mark.asyncio
async def test_signup_already_registered_user(
    auth_service: AuthService, mock_session: AsyncMock
) -> None:
    """Test signup with an already registered email."""
    # Setup
    existing_user = User(email="test@example.com")
    auth_service.user_repo.get_by_email.return_value = existing_user  # type: ignore

    # Execute & Assert
    with pytest.raises(ValueError, match="already registered"):
        await auth_service.signup("test@example.com", "password")


@pytest.mark.asyncio
async def test_verify_email_success(
    auth_service: AuthService, mock_session: AsyncMock
) -> None:
    """Test successful email verification."""
    # Setup - Create pending registration with proper data
    pending = PendingRegistration(
        email="a@b.com",
        hashed_password=hash_password("pw"),
        verification_token="token123",
        expires_at=datetime.now(UTC) + timedelta(hours=1),
    )

    # Configure mocks on the service directly
    auth_service.pending_repo.get_by_token.return_value = pending  # type: ignore
    auth_service.user_repo.create.return_value = None  # type: ignore
    auth_service.pending_repo.delete.return_value = None  # type: ignore

    # Execute
    result = await auth_service.verify_email("token123")

    # Assert
    assert result["message"] == "Email verified. Account created successfully."
    assert "access_token" in result

    auth_service.pending_repo.get_by_token.assert_awaited_once_with("token123")  # type: ignore


@pytest.mark.asyncio
async def test_verify_email_expired_token(
    auth_service: AuthService, mock_session: AsyncMock
) -> None:
    """Test email verification with an expired token."""
    # Setup - Create pending registration with expired token
    pending = PendingRegistration(
        email="a@b.com",
        hashed_password=hash_password("pw"),
        verification_token="expired_token",
        expires_at=datetime.now(UTC) - timedelta(hours=1),  # Expired
    )

    auth_service.pending_repo.get_by_token.return_value = pending  # type: ignore

    # Execute & Assert - Match the actual error message from the service
    with pytest.raises(ValueError, match="Verification token has expired"):
        await auth_service.verify_email("expired_token")


@pytest.mark.asyncio
async def test_verify_email_invalid_token(
    auth_service: AuthService, mock_session: AsyncMock
) -> None:
    """Test email verification with an invalid token."""
    # Setup
    auth_service.pending_repo.get_by_token.return_value = None  # type: ignore

    # Execute & Assert
    with pytest.raises(ValueError, match="Invalid verification token"):
        await auth_service.verify_email("invalid_token")
