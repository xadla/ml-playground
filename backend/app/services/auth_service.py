import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password, verify_password
from app.db.pending_registrations import PendingRegistration
from app.db.repositories.pending_registration import PendingRegistrationRepository
from app.db.repositories.user import UserRepository
from app.db.users import User
from app.infrastructure.email import EmailSender


class AuthService:
    def __init__(
        self,
        session: AsyncSession,
        email_sender: EmailSender,
    ):
        self.user_repo = UserRepository(session)
        self.pending_repo = PendingRegistrationRepository(session)
        self.email_sender = email_sender
        self.session = session

    async def signup(self, email: str, password: str) -> dict[str, str]:
        # Check if a verified user already exists
        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:
            raise ValueError("Email already registered")

        # Check if a pending registration already exists
        pending = await self.pending_repo.get_by_email(email)
        if pending:
            if pending.expires_at > datetime.now(UTC):
                # Token still valid – don't recreate, just notify to check email
                raise ValueError("Verification already pending – check your email")
            else:
                # Expired – delete it so we can create a new one
                await self.pending_repo.delete(pending.id)  # type: ignore

        # Create pending registration
        hashed_pw = hash_password(password)
        token = str(uuid.uuid4())
        expires_at = datetime.now(UTC) + timedelta(hours=24)

        new_pending = PendingRegistration(
            email=email,
            hashed_password=hashed_pw,
            verification_token=token,
            expires_at=expires_at,
        )
        await self.pending_repo.create(new_pending)

        # Send verification email
        await self.email_sender.send_verification_email(email, token)

        return {
            "message": "Verification email sent. Please check your inbox to complete registration.",
            "email": email,
        }

    async def verify_email(self, token: str) -> dict[str, str]:
        pending = await self.pending_repo.get_by_token(token)
        if not pending:
            raise ValueError("Invalid verification token")
        if pending.expires_at < datetime.now(UTC):
            # Clean up expired token
            await self.pending_repo.delete(pending.id)  # type: ignore
            raise ValueError("Verification token has expired")

        # Create real user
        user = User(
            email=pending.email,
            hashed_password=pending.hashed_password,
        )
        await self.user_repo.create(user)

        # Delete pending registration
        await self.pending_repo.delete(pending.id)  # type: ignore

        # Generate access token
        access_token = create_access_token(data={"sub": str(user.id)})
        return {
            "message": "Email verified. Account created successfully.",
            "access_token": access_token,
            "token_type": "bearer",
        }

    async def login(self, email: str, password: str) -> dict[str, str]:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise ValueError("Invalid email or password")
        access_token = create_access_token(data={"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}

    async def resend_verification(self, email: str) -> dict[str, str]:
        pending = await self.pending_repo.get_by_email(email)
        if not pending:
            raise ValueError("No pending registration for this email")
        if pending.expires_at < datetime.now(UTC):
            await self.pending_repo.delete(pending.id)  # type: ignore
            raise ValueError("Verification token has expired – please sign up again")

        # Resend the same token
        await self.email_sender.send_verification_email(
            email, pending.verification_token
        )
        return {"message": "Verification email resent."}

    async def get_me(self, user: User) -> dict[str, str]:
        return {
            "id": str(user.id),
            "email": user.email,
            "created_at": user.created_at.isoformat(),
        }
