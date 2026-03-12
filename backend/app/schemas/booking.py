"""Pydantic schemas (DTOs) for Bookings."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


class BookingCreate(BaseModel):
    event_type_id: int
    booker_name: str = Field(..., min_length=1, max_length=255)
    booker_email: EmailStr
    start_time: datetime
    timezone: str = "Asia/Kolkata"
    custom_responses: dict[str, str] = {}
    recurring_uid: Optional[str] = None


class BookingReschedule(BaseModel):
    start_time: datetime
    timezone: str = "Asia/Kolkata"


class BookingResponse(BaseModel):
    id: int
    event_type_id: int
    booker_name: str
    booker_email: str
    start_time: datetime
    end_time: datetime
    status: str
    timezone: str
    custom_responses: dict[str, str]
    recurring_uid: Optional[str] = None
    created_at: datetime
    event_title: Optional[str] = None
    event_duration: Optional[int] = None

    class Config:
        from_attributes = True
