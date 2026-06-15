from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.pending_registrations import PendingRegistration
from app.db.repositories.base import BaseRepository


class PendingRegistrationRepository(BaseRepository[PendingRegistration]):
    def __init__(self, session: AsyncSession):
        super().__init__(PendingRegistration, session)

    async def get_by_email(self, email: str) -> PendingRegistration | None:
        stmt = select(PendingRegistration).where(PendingRegistration.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_token(self, token: str) -> PendingRegistration | None:
        stmt = select(PendingRegistration).where(
            PendingRegistration.verification_token == token
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_expired(self) -> int:
        """Delete all expired pending registrations. Returns count."""
        stmt = select(PendingRegistration).where(
            PendingRegistration.expires_at < datetime.now(UTC)
        )
        result = await self.session.execute(stmt)
        expired = result.scalars().all()
        for reg in expired:
            await self.session.delete(reg)
        await self.session.commit()
        return len(expired)
