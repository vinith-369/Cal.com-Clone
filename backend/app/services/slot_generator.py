"""Slot generation using the Strategy pattern.

Computes available time slots for a given date by combining:
  - Weekly availability rules
  - Date-specific overrides (custom hours or blocked dates)
  - Existing bookings (to avoid double-booking)
  - Buffer time before/after events
"""

from datetime import date, time, datetime, timedelta

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

    def get_available_slots(
        self,
        target_date: date,
        existing_bookings: list[Booking],
    ) -> list[dict]:
        """Return list of available start times for the target date."""

        # Step 1: Determine working hours for this date
        working_periods = self._get_working_periods(target_date)
        if not working_periods:
            return []

        from zoneinfo import ZoneInfo
        tz = ZoneInfo(self.schedule.timezone)
        
        # Step 2: Generate candidate slots from working periods
        candidates = []
        for start_t, end_t in working_periods:
            slot_start = datetime.combine(target_date, start_t).replace(tzinfo=tz)
            slot_end_limit = datetime.combine(target_date, end_t).replace(tzinfo=tz)

            while slot_start + self.duration <= slot_end_limit:
                candidates.append(slot_start)
                slot_start += self.duration

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

    def _get_working_periods(self, target_date: date) -> list[tuple[time, time]]:
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
