"""Service layer for Booking business logic."""

import calendar
import uuid
from datetime import date, datetime, timedelta
from typing import Optional, List
from zoneinfo import ZoneInfo
from fastapi import HTTPException

from app.repositories.booking_repo import BookingRepository
from app.repositories.event_type_repo import EventTypeRepository
from app.repositories.availability_repo import AvailabilityRepository
from app.services.slot_generator import SlotGenerator
from app.schemas.booking import BookingCreate, BookingReschedule


class BookingService:
    """Centralizes booking creation, cancellation, rescheduling, and slot queries."""

    def __init__(
        self,
        booking_repo: BookingRepository,
        event_type_repo: EventTypeRepository,
        availability_repo: AvailabilityRepository,
    ):
        self.booking_repo = booking_repo
        self.event_type_repo = event_type_repo
        self.availability_repo = availability_repo

    def get_available_slots(
        self, slug: str, target_date: date, exclude_booking_id: Optional[int] = None
    ) -> list[dict]:
        """Compute available time slots for a given event type and date."""
        event_type = self.event_type_repo.get_by_slug(slug)
        if not event_type:
            raise HTTPException(status_code=404, detail="Event type not found")

        # Get the availability schedule
        schedule = None
        if event_type.availability_schedule_id:
            schedule = self.availability_repo.get_schedule_by_id(
                event_type.availability_schedule_id
            )
        if not schedule:
            schedule = self.availability_repo.get_default_schedule()
        if not schedule:
            raise HTTPException(
                status_code=400, detail="No availability schedule configured"
            )

        tz = ZoneInfo(schedule.timezone)
        
        # Get existing bookings for the date range
        day_start = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=tz)
        day_end = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=tz)
        existing_bookings = self.booking_repo.get_bookings_for_date_range(
            event_type.id, day_start, day_end, exclude_booking_id
        )

        # Use SlotGenerator (Strategy pattern)
        generator = SlotGenerator(
            schedule=schedule,
            duration_minutes=event_type.duration_minutes,
            buffer_before=event_type.buffer_before,
            buffer_after=event_type.buffer_after,
        )
        return generator.get_available_slots(target_date, existing_bookings)

    def create_booking(self, data: BookingCreate):
        """Create a new booking (or series of bookings) with conflict detection."""
        event_type = self.event_type_repo.get_by_id(data.event_type_id)
        if not event_type:
            raise HTTPException(status_code=404, detail="Event type not found")
        if not event_type.is_active:
            raise HTTPException(status_code=400, detail="Event type is not active")

        # Get the schedule for slot validation
        schedule = None
        if event_type.availability_schedule_id:
            schedule = self.availability_repo.get_schedule_by_id(
                event_type.availability_schedule_id
            )
        if not schedule:
            schedule = self.availability_repo.get_default_schedule()
        if not schedule:
            raise HTTPException(
                status_code=400, detail="No availability schedule configured"
            )

        generator = SlotGenerator(
            schedule=schedule,
            duration_minutes=event_type.duration_minutes,
            buffer_before=event_type.buffer_before,
            buffer_after=event_type.buffer_after,
        )

        tz = ZoneInfo(schedule.timezone)
        
        recurring_uid = str(uuid.uuid4()) if event_type.is_recurring else None
        occurrences_count = event_type.recurring_count if event_type.is_recurring and event_type.recurring_count else 1
        
        created_bookings = []
        current_start_time = data.start_time

        for i in range(occurrences_count):
            end_time = current_start_time + timedelta(minutes=event_type.duration_minutes)

            # Check for conflicts (including buffer times)
            buffer_start = current_start_time - timedelta(minutes=event_type.buffer_before)
            buffer_end = end_time + timedelta(minutes=event_type.buffer_after)
            conflicts = self.booking_repo.get_bookings_for_date_range(
                event_type.id, buffer_start, buffer_end
            )
            
            # Check date overrides and weekly rules via SlotGenerator for this specific date
            target_date = current_start_time.date()
            day_start = datetime.combine(target_date, datetime.min.time()).replace(tzinfo=tz)
            day_end = datetime.combine(target_date, datetime.max.time()).replace(tzinfo=tz)
            existing_bookings = self.booking_repo.get_bookings_for_date_range(
                event_type.id, day_start, day_end
            )
            
            available_slots = generator.get_available_slots(target_date, existing_bookings)
            
            # Determine current_start_iso in exact format slot_generator returns it
            current_start_iso = current_start_time.isoformat()
            
            # Verify if the current_start_time is exactly one of the available slots
            is_slot_available = any(
                slot["start"] == current_start_iso 
                for slot in available_slots
            )

            # If it's the first booking and it conflicts, abort entirely
            if i == 0 and (conflicts or not is_slot_available):
                raise HTTPException(
                    status_code=409, detail="The selected time slot is no longer available"
                )

            # For subsequent recurring bookings, if it conflicts, we simply skip this occurrence (Cal.com behavior)
            if not conflicts and is_slot_available:
                booking_data = {
                    "event_type_id": data.event_type_id,
                    "booker_name": data.booker_name,
                    "booker_email": data.booker_email,
                    "start_time": current_start_time,
                    "end_time": end_time,
                    "timezone": data.timezone,
                    "custom_responses": data.custom_responses,
                    "status": "confirmed",
                    "recurring_uid": recurring_uid if occurrences_count > 1 else None
                }
                booking = self.booking_repo.create(booking_data)
                created_bookings.append(booking)

            # Advance to the next occurrence if recurring
            if event_type.is_recurring:
                if event_type.recurring_interval == "daily":
                    current_start_time += timedelta(days=1)
                elif event_type.recurring_interval == "weekly":
                    current_start_time += timedelta(weeks=1)
                elif event_type.recurring_interval == "monthly":
                    # Simple monthly advance (+30 days approximately, or strict month mapping)
                    # For simplicity, we use +4 weeks as a standard "monthly" recurring on same weekday
                    current_start_time += timedelta(weeks=4)
                else:
                    break

        return created_bookings[0] if created_bookings else None

    def cancel_booking(self, booking_id: int):
        """Cancel a booking."""
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.status == "cancelled":
            raise HTTPException(status_code=400, detail="Booking is already cancelled")

        updated = self.booking_repo.update_status(booking, "cancelled")
        return updated

    def reschedule_booking(self, booking_id: int, data: BookingReschedule):
        """Reschedule a booking to a new time slot."""
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.status != "confirmed":
            raise HTTPException(status_code=400, detail="Only confirmed bookings can be rescheduled")

        event_type = self.event_type_repo.get_by_id(booking.event_type_id)
        if not event_type:
            raise HTTPException(status_code=404, detail="Event type not found")

        new_end = data.start_time + timedelta(minutes=event_type.duration_minutes)

        # Check for conflicts (excluding self)
        buffer_start = data.start_time - timedelta(minutes=event_type.buffer_before)
        buffer_end = new_end + timedelta(minutes=event_type.buffer_after)
        conflicts = self.booking_repo.get_bookings_for_date_range(
            event_type.id, buffer_start, buffer_end, exclude_booking_id=booking_id
        )
        if conflicts:
            raise HTTPException(
                status_code=409, detail="New time slot is not available"
            )

        updated = self.booking_repo.update_times(booking, data.start_time, new_end, data.timezone)
        return updated

    def get_booking(self, booking_id: int):
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking

    def list_upcoming(self):
        return self.booking_repo.get_upcoming()

    def list_past(self):
        return self.booking_repo.get_past()

    def list_cancelled(self):
        return self.booking_repo.get_cancelled()

    def get_available_dates_for_month(
        self, slug: str, year: int, month: int
    ) -> list[str]:
        """Return a list of date strings (YYYY-MM-DD) that have at least one available slot."""
        event_type = self.event_type_repo.get_by_slug(slug)
        if not event_type:
            raise HTTPException(status_code=404, detail="Event type not found")

        # Get the availability schedule
        schedule = None
        if event_type.availability_schedule_id:
            schedule = self.availability_repo.get_schedule_by_id(
                event_type.availability_schedule_id
            )
        if not schedule:
            schedule = self.availability_repo.get_default_schedule()
        if not schedule:
            return []

        tz = ZoneInfo(schedule.timezone)

        generator = SlotGenerator(
            schedule=schedule,
            duration_minutes=event_type.duration_minutes,
            buffer_before=event_type.buffer_before,
            buffer_after=event_type.buffer_after,
        )

        # Get all bookings for this month
        first_day = date(year, month, 1)
        last_day_num = calendar.monthrange(year, month)[1]
        last_day = date(year, month, last_day_num)
        month_start = datetime.combine(first_day, datetime.min.time()).replace(tzinfo=tz)
        month_end = datetime.combine(last_day, datetime.max.time()).replace(tzinfo=tz)
        all_bookings = self.booking_repo.get_bookings_for_date_range(
            event_type.id, month_start, month_end
        )

        available_dates = []
        today = date.today()
        current = first_day
        while current <= last_day:
            if current >= today:
                # Filter bookings for this specific day
                day_start = datetime.combine(current, datetime.min.time()).replace(tzinfo=tz)
                day_end = datetime.combine(current, datetime.max.time()).replace(tzinfo=tz)
                day_bookings = [
                    b for b in all_bookings
                    if b.start_time < day_end and b.end_time > day_start
                ]
                slots = generator.get_available_slots(current, day_bookings)
                if slots:
                    available_dates.append(current.isoformat())
            current += timedelta(days=1)

        return available_dates
