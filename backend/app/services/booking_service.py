"""Service layer for Booking business logic."""

import uuid
from datetime import date, datetime, timedelta
from typing import Optional, List, Dict
from zoneinfo import ZoneInfo
from fastapi import HTTPException

from app.repositories.booking_repo import BookingRepository
from app.repositories.event_type_repo import EventTypeRepository
from app.repositories.availability_repo import AvailabilityRepository
from app.services.slot_generator import SlotGenerator
from app.services.email_service import EmailService
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
        self.email_service = EmailService()

    def get_available_slots(
        self, slug: str, target_date: date, exclude_booking_id: Optional[int] = None
    ) -> List[Dict]:
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

        # Send email for the first booking (or a summary email)
        if created_bookings:
            self.email_service.notify_booking_created({
                "booker_name": data.booker_name,
                "booker_email": data.booker_email,
                "event_title": f"{event_type.title} {'(Recurring)' if occurrences_count > 1 else ''}",
                "start_time": data.start_time.isoformat(),
                "duration": event_type.duration_minutes,
            })

        return created_bookings[0] if created_bookings else None

    def cancel_booking(self, booking_id: int):
        """Cancel a booking and notify the booker."""
        booking = self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.status == "cancelled":
            raise HTTPException(status_code=400, detail="Booking is already cancelled")

        updated = self.booking_repo.update_status(booking, "cancelled")

        self.email_service.notify_booking_cancelled({
            "booker_name": booking.booker_name,
            "booker_email": booking.booker_email,
            "event_title": booking.event_type.title if booking.event_type else "Meeting",
            "start_time": booking.start_time.isoformat(),
        })

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

        self.email_service.notify_booking_rescheduled({
            "booker_name": booking.booker_name,
            "booker_email": booking.booker_email,
            "event_title": event_type.title,
            "start_time": data.start_time.isoformat(),
            "duration": event_type.duration_minutes,
        })

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
