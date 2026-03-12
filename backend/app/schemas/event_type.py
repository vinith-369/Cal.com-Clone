"""Pydantic schemas (DTOs) for Event Types."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CustomQuestionBase(BaseModel):
    label: str
    type: str = "text"
    required: bool = False
    options: list[str] = []
    sort_order: int = 0


class CustomQuestionCreate(CustomQuestionBase):
    pass


class CustomQuestionResponse(CustomQuestionBase):
    id: int

    class Config:
        from_attributes = True


class EventTypeBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    duration_minutes: int = Field(30, ge=5, le=480)
    buffer_before: int = Field(0, ge=0, le=120)
    buffer_after: int = Field(0, ge=0, le=120)
    is_active: bool = True
    availability_schedule_id: Optional[int] = None
    
    # Recurring Event Settings
    is_recurring: bool = False
    recurring_interval: Optional[str] = None  # 'daily', 'weekly', 'monthly'
    recurring_count: Optional[int] = None     # Number of total occurrences


class EventTypeCreate(EventTypeBase):
    custom_questions: list[CustomQuestionCreate] = []


class EventTypeUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    buffer_before: Optional[int] = Field(None, ge=0, le=120)
    buffer_after: Optional[int] = Field(None, ge=0, le=120)
    is_active: Optional[bool] = None
    availability_schedule_id: Optional[int] = None
    is_recurring: Optional[bool] = None
    recurring_interval: Optional[str] = None
    recurring_count: Optional[int] = None
    custom_questions: Optional[list[CustomQuestionCreate]] = None


class EventTypeResponse(EventTypeBase):
    id: int
    custom_questions: list[CustomQuestionResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EventTypePublicResponse(BaseModel):
    """Minimal info shown on the public booking page."""
    id: int
    title: str
    slug: str
    description: str
    duration_minutes: int
    custom_questions: list[CustomQuestionResponse] = []

    class Config:
        from_attributes = True
