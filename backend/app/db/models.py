from datetime import UTC, datetime

from sqlalchemy.orm import DeclarativeBase


def utcnow() -> datetime:
    """Return current UTC datetime with timezone awareness."""
    return datetime.now(UTC)


class Base(DeclarativeBase):
    pass
