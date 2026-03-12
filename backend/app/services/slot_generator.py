"""Slot generation using the Strategy pattern.

Computes available time slots for a given date by combining:
  - Weekly availability rules
  - Date-specific overrides (custom hours or blocked dates)
  - Existing bookings (to avoid double-booking)
  - Buffer time before/after events
"""

from datetime import date, time, datetime, timedelta
from typing import List, Optional, Dict, Tuple

from app.models.availability import AvailabilitySchedule, DateOverride
from app.models.booking import Booking


class SlotGenerator:
    """Generates available booking slots for a given date.

    Strategy pattern: the generation strategy varies based on whether
    a date override exists, whether buffer times are specified, etc.
    """

    def __init__(
        self,
        schedule: AvailabilitySchedule,
        duration_minutes: int,
        buffer_before: int = 0,
        buffer_after: int = 0,
    ):
        self.schedule = schedule
        self.duration = timedelta(minutes=duration_minutes)
        self.buffer_before = timedelta(minutes=buffer_before)
        self.buffer_after = timedelta(minutes=buffer_after)
        # Total block = buffer_before + meeting + buffer_after
        self.slot_step = self.buffer_before + self.duration + self.buffer_after

    def get_available_slots(
        self,
        target_date: date,
        existing_bookings: List[Booking],
    ) -> List[Dict]:
        """Return list of available start times for the target date."""

        # Step 1: Determine working hours for this date
        working_periods = self._get_working_periods(target_date)
        if not working_periods:
            return []

        from zoneinfo import ZoneInfo
        tz = ZoneInfo(self.schedule.timezone)

        # Step 2: Generate candidate slots from working periods
        # Each slot occupies: [buffer_before] [meeting duration] [buffer_after]
        # The meeting starts at slot_start + buffer_before conceptually,
        # but the USER picks the meeting start time, so we offset:
        #   - The first available meeting start = period_start + buffer_before
        #   - Each next meeting start advances by slot_step
        #   - The meeting must end + buffer_after within the period end
        candidates = []
        for start_t, end_t in working_periods:
            period_start = datetime.combine(target_date, start_t).replace(tzinfo=tz)
            period_end = datetime.combine(target_date, end_t).replace(tzinfo=tz)

            # First meeting can start at period start + buffer_before
            meeting_start = period_start + self.buffer_before

            while meeting_start + self.duration + self.buffer_after <= period_end:
                candidates.append(meeting_start)
                # Next meeting starts after: current_meeting_end + buffer_after + buffer_before
                meeting_start += self.slot_step

        # Step 3: Filter out slots that conflict with existing bookings (+ buffers)
        available = []
        for slot_start in candidates:
            slot_end = slot_start + self.duration
            buffered_start = slot_start - self.buffer_before
            buffered_end = slot_end + self.buffer_after

            conflict = False
            for booking in existing_bookings:
                # Check overlap between buffered slot and booking
                if buffered_start < booking.end_time and buffered_end > booking.start_time:
                    conflict = True
                    break

            if not conflict:
                available.append({
                    "start": slot_start.isoformat(),
                    "end": slot_end.isoformat(),
                })

        return available

    def _get_working_periods(self, target_date: date) -> List[Tuple[time, time]]:
        """Determine working time periods for a specific date.

        Checks date overrides first (Strategy: override takes precedence),
        then falls back to weekly rules.
        """
        # Check for date override
        for override in self.schedule.overrides:
            if override.date == target_date:
                if override.is_blocked:
                    return []  # Date is fully blocked
                if override.start_time and override.end_time:
                    return [(override.start_time, override.end_time)]

        # Fall back to weekly rules
        day_of_week = target_date.weekday()  # 0=Monday
        periods = []
        for rule in self.schedule.rules:
            if rule.day_of_week == day_of_week:
                periods.append((rule.start_time, rule.end_time))

        return sorted(periods, key=lambda p: p[0])
