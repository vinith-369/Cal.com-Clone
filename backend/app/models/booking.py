"""SQLAlchemy model for Bookings."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Booking(Base):
    """A confirmed booking for an event type time slot."""

    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id"), nullable=False)
    booker_name = Column(String(255), nullable=False)
    booker_email = Column(String(255), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), default="confirmed")  # confirmed, cancelled, rescheduled
    timezone = Column(String(100), default="Asia/Kolkata")
    custom_responses = Column(JSON, default=dict)  # answers to custom questions
    recurring_uid = Column(String(50), nullable=True, index=True) # group recurring bookings
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event_type = relationship("EventType", back_populates="bookings")
