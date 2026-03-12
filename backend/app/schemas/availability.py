"""Pydantic schemas (DTOs) for Availability Schedules, Rules, and Date Overrides."""

from datetime import date, time, datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Availability Rules ──────────────────────────────────────────────

class AvailabilityRuleBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)  # 0=Mon … 6=Sun
    start_time: time
    end_time: time


class AvailabilityRuleCreate(AvailabilityRuleBase):
    pass


class AvailabilityRuleResponse(AvailabilityRuleBase):
    id: int

    class Config:
        from_attributes = True


# ── Date Overrides ──────────────────────────────────────────────────

class DateOverrideBase(BaseModel):
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_blocked: bool = False


class DateOverrideCreate(DateOverrideBase):
    pass


class DateOverrideResponse(DateOverrideBase):
    id: int

    class Config:
        from_attributes = True


# ── Availability Schedules ──────────────────────────────────────────

class AvailabilityScheduleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    timezone: str = "Asia/Kolkata"
    is_default: bool = False


class AvailabilityScheduleCreate(AvailabilityScheduleBase):
    rules: list[AvailabilityRuleCreate] = []


class AvailabilityScheduleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    timezone: Optional[str] = None
    is_default: Optional[bool] = None
    rules: Optional[list[AvailabilityRuleCreate]] = None


class AvailabilityScheduleResponse(AvailabilityScheduleBase):
    id: int
    rules: list[AvailabilityRuleResponse] = []
    overrides: list[DateOverrideResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True
