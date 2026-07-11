import uuid
from datetime import UTC, datetime, timedelta

import structlog
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
        self.logger = structlog.get_logger(__name__)

    async def signup(self, email: str, password: str) -> dict[str, str]:
        """Register a new user with email verification."""
        # Log start of operation with context
        self.logger.info(
            "signup.start",
            email=email,
            email_obfuscated=self._obfuscate_email(email),
        )

        try:
            # Check if a verified user already exists
            existing_user = await self.user_repo.get_by_email(email)
            if existing_user:
                self.logger.warning(
                    "signup.user_already_exists",
                    email_obfuscated=self._obfuscate_email(email),
                    user_id=str(existing_user.id),
                )
                raise ValueError("Email already registered")

            # Check if a pending registration already exists
            pending = await self.pending_repo.get_by_email(email)
            if pending:
                if pending.expires_at > datetime.now(UTC):
                    # Token still valid – don't recreate
                    self.logger.warning(
                        "signup.pending_already_exists",
                        email_obfuscated=self._obfuscate_email(email),
                        expires_at=pending.expires_at.isoformat(),
                    )
                    raise ValueError("Verification already pending – check your email")
                else:
                    # Expired – delete it so we can create a new one
                    self.logger.info(
                        "signup.removing_expired_pending",
                        email_obfuscated=self._obfuscate_email(email),
                        pending_id=str(pending.id),
                    )
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

            self.logger.info(
                "signup.success",
                email_obfuscated=self._obfuscate_email(email),
                pending_id=str(new_pending.id),
                expires_at=expires_at.isoformat(),
            )

            return {
                "message": "Verification email sent. Please check your inbox to complete registration.",
                "email": email,
            }

        except Exception as e:
            self.logger.error(
                "signup.failed",
                email_obfuscated=self._obfuscate_email(email),
                error=str(e),
                exc_info=True,
            )
            raise

    async def verify_email(self, token: str) -> dict[str, str]:
        """Verify user email and complete registration."""
        self.logger.info("verify.start", token_prefix=token[:8])

        try:
            pending = await self.pending_repo.get_by_token(token)
            if not pending:
                self.logger.warning(
                    "verify.invalid_token",
                    token_prefix=token[:8],
                )
                raise ValueError("Invalid verification token")

            if pending.expires_at < datetime.now(UTC):
                # Clean up expired token
                self.logger.warning(
                    "verify.token_expired",
                    token_prefix=token[:8],
                    email_obfuscated=self._obfuscate_email(pending.email),
                    pending_id=str(pending.id),
                    expires_at=pending.expires_at.isoformat(),
                )
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

            self.logger.info(
                "verify.success",
                user_id=str(user.id),
                email_obfuscated=self._obfuscate_email(user.email),
            )

            return {
                "message": "Email verified. Account created successfully.",
                "access_token": access_token,
                "token_type": "bearer",
            }

        except Exception as e:
            self.logger.error(
                "verify.failed",
                token_prefix=token[:8],
                error=str(e),
                exc_info=True,
            )
            raise

    async def login(self, email: str, password: str) -> dict[str, str]:
        """Authenticate a user and return access token."""
        self.logger.info(
            "login.start",
            email_obfuscated=self._obfuscate_email(email),
        )

        try:
            user = await self.user_repo.get_by_email(email)
            if not user or not verify_password(password, user.hashed_password):
                self.logger.warning(
                    "login.invalid_credentials",
                    email_obfuscated=self._obfuscate_email(email),
                )
                raise ValueError("Invalid email or password")

            access_token = create_access_token(data={"sub": str(user.id)})

            self.logger.info(
                "login.success",
                user_id=str(user.id),
                email_obfuscated=self._obfuscate_email(email),
            )

            return {"access_token": access_token, "token_type": "bearer"}

        except Exception as e:
            self.logger.error(
                "login.failed",
                email_obfuscated=self._obfuscate_email(email),
                error=str(e),
                exc_info=True,
            )
            raise

    async def resend_verification(self, email: str) -> dict[str, str]:
        """Resend verification email for pending registration."""
        self.logger.info(
            "resend.start",
            email_obfuscated=self._obfuscate_email(email),
        )

        try:
            pending = await self.pending_repo.get_by_email(email)
            if not pending:
                self.logger.warning(
                    "resend.no_pending_registration",
                    email_obfuscated=self._obfuscate_email(email),
                )
                raise ValueError("No pending registration for this email")

            if pending.expires_at < datetime.now(UTC):
                self.logger.warning(
                    "resend.token_expired",
                    email_obfuscated=self._obfuscate_email(email),
                    pending_id=str(pending.id),
                    expires_at=pending.expires_at.isoformat(),
                )
                await self.pending_repo.delete(pending.id)  # type: ignore
                raise ValueError(
                    "Verification token has expired – please sign up again"
                )

            # Resend the same token
            await self.email_sender.send_verification_email(
                email, pending.verification_token
            )

            self.logger.info(
                "resend.success",
                email_obfuscated=self._obfuscate_email(email),
                pending_id=str(pending.id),
            )

            return {"message": "Verification email resent."}

        except Exception as e:
            self.logger.error(
                "resend.failed",
                email_obfuscated=self._obfuscate_email(email),
                error=str(e),
                exc_info=True,
            )
            raise

    async def get_me(self, user: User) -> dict[str, str]:
        """Get current user profile."""
        self.logger.debug(
            "get_me",
            user_id=str(user.id),
            email_obfuscated=self._obfuscate_email(user.email),
        )

        return {
            "id": str(user.id),
            "email": user.email,
            "created_at": user.created_at.isoformat(),
        }

    @staticmethod
    def _obfuscate_email(email: str) -> str:
        """Obfuscate email for logging to protect privacy."""
        if "@" not in email:
            return "invalid_email"
        local, domain = email.split("@", 1)
        if len(local) <= 2:
            return f"{local}@...{domain}"
        return f"{local[:2]}...@{domain}"
