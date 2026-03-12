"""SQLAlchemy model for Custom Booking Questions."""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class CustomQuestion(Base):
    """A custom question shown on the booking form for an event type."""

    __tablename__ = "custom_questions"

    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id"), nullable=False)
    label = Column(String(500), nullable=False)
    type = Column(String(50), default="text")  # text, textarea, select, radio, checkbox
    required = Column(Boolean, default=False)
    options = Column(JSON, default=list)  # options for select/radio/checkbox
    sort_order = Column(Integer, default=0)

    event_type = relationship("EventType", back_populates="custom_questions")
