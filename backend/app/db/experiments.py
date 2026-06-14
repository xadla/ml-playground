import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import JSON, DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.datasets import Dataset
from app.db.experiment_results import ExperimentResult
from app.db.models import Base, utcnow
from app.db.users import User
from app.models.domain.enums import ExperimentStatusEnum


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    dataset_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False,
    )
    algorithm: Mapped[str] = mapped_column(String(50))
    hyperparameters: Mapped[dict[str, Any]] = mapped_column(JSON)
    target_column: Mapped[str] = mapped_column(String(100))
    status: Mapped[ExperimentStatusEnum] = mapped_column(
        Enum(ExperimentStatusEnum, name="experiment_status", create_type=False),
        default=ExperimentStatusEnum.pending,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    owner: Mapped[Optional["User"]] = relationship(back_populates="experiments")
    dataset: Mapped["Dataset"] = relationship(back_populates="experiments")
    result: Mapped[Optional["ExperimentResult"]] = relationship(
        back_populates="experiment", uselist=False
    )
