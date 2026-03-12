"""SQLAlchemy models for Availability Schedules, Rules, and Date Overrides."""

from sqlalchemy import Column, Integer, String, Boolean, Date, Time, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class AvailabilitySchedule(Base):
    """A named availability schedule (e.g., 'Working Hours')."""

    __tablename__ = "availability_schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    timezone = Column(String(100), nullable=False, default="Asia/Kolkata")
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    rules = relationship(
        "AvailabilityRule", back_populates="schedule", cascade="all, delete-orphan",
        order_by="AvailabilityRule.day_of_week"
    )
    overrides = relationship(
        "DateOverride", back_populates="schedule", cascade="all, delete-orphan",
        order_by="DateOverride.date"
    )
    event_types = relationship("EventType", back_populates="availability_schedule")


class AvailabilityRule(Base):
    """A recurring weekly rule (e.g., Monday 9:00–17:00)."""

    __tablename__ = "availability_rules"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("availability_schedules.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday … 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    schedule = relationship("AvailabilitySchedule", back_populates="rules")


class DateOverride(Base):
    """Override for a specific date (custom hours or blocked)."""

    __tablename__ = "date_overrides"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("availability_schedules.id"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)  # Null if is_blocked
    end_time = Column(Time, nullable=True)
    is_blocked = Column(Boolean, default=False)

    schedule = relationship("AvailabilitySchedule", back_populates="overrides")
