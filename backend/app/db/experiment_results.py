import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

if TYPE_CHECKING:
    from app.db.experiments import Experiment
from app.db.models import Base, utcnow


class ExperimentResult(Base):
    __tablename__ = "experiment_results"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    experiment_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("experiments.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    metrics: Mapped[dict[str, int] | None] = mapped_column(JSON, nullable=True)
    confusion_matrix_data: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    plot_paths: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow
    )

    # Relationship (1:1)
    experiment: Mapped["Experiment"] = relationship(back_populates="result")

    __table_args__ = (
        UniqueConstraint("experiment_id", name="uq_experiment_result_experiment_id"),
    )
