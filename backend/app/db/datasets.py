import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.experiments import Experiment
from app.db.models import Base, utcnow
from app.db.users import User
from app.models.domain.enums import DatasetTypeEnum


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255))
    type: Mapped[DatasetTypeEnum] = mapped_column(
        Enum(DatasetTypeEnum, name="dataset_type", create_type=False), nullable=False
    )
    # Only for canvas datasets
    data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    # Only for uploaded datasets
    file_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Shared fields
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    column_names: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    is_temporary: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    # Relationships
    owner: Mapped[Optional["User"]] = relationship(back_populates="datasets")
    experiments: Mapped[list["Experiment"]] = relationship(back_populates="dataset")
