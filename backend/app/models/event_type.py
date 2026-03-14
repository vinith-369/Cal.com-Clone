"""SQLAlchemy model for Event Types."""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class EventType(Base):
    """Represents a schedulable event type (e.g., '30 Minute Meeting')."""

    __tablename__ = "event_types"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    description = Column(Text, default="")
    duration_minutes = Column(Integer, nullable=False, default=30)
    buffer_before = Column(Integer, default=0)  # minutes before event
    buffer_after = Column(Integer, default=0)   # minutes after event
    is_active = Column(Boolean, default=True)
    availability_schedule_id = Column(
        Integer, ForeignKey("availability_schedules.id"), nullable=True
    )
    
    # Recurring Event Settings
    is_recurring = Column(Boolean, default=False)
    recurring_interval = Column(String(50), nullable=True)  # 'daily', 'weekly', 'monthly'
    recurring_count = Column(Integer, nullable=True)        # Number of total occurrences
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    bookings = relationship("Booking", back_populates="event_type", cascade="all, delete-orphan")
    availability_schedule = relationship("AvailabilitySchedule", back_populates="event_types")




# """SQLAlchemy model for Event Types."""

# from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func

# from app.database import Base


# class EventType(Base):
#     """Represents a schedulable event type (e.g., '30 Minute Meeting')."""

#     __tablename__ = "event_types"

#     id = Column(Integer, primary_key=True, index=True)
#     title = Column(String(255), nullable=False)
#     slug = Column(String(255), unique=True, nullable=False, index=True)
#     description = Column(Text, default="")
#     duration_minutes = Column(Integer, nullable=False, default=30)
#     buffer_before = Column(Integer, default=0)  # minutes before event
#     buffer_after = Column(Integer, default=0)   # minutes after event
#     is_active = Column(Boolean, default=True)
#     availability_schedule_id = Column(
#         Integer, ForeignKey("availability_schedules.id"), nullable=True
#     )
    
#     # Recurring Event Settings
#     is_recurring = Column(Boolean, default=False)
#     recurring_interval = Column(String(50), nullable=True)  # 'daily', 'weekly', 'monthly'
#     recurring_count = Column(Integer, nullable=True)        # Number of total occurrences
#     created_at = Column(DateTime(timezone=True), server_default=func.now())
#     updated_at = Column(
#         DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
#     )

#     # Relationships
#     bookings = relationship("Booking", back_populates="event_type", cascade="all, delete-orphan")
#     custom_questions = relationship(
#         "CustomQuestion", back_populates="event_type", cascade="all, delete-orphan",
#         order_by="CustomQuestion.sort_order"
#     )
#     availability_schedule = relationship("AvailabilitySchedule", back_populates="event_types")
