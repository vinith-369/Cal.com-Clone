"""API router for Bookings."""

from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.booking_repo import BookingRepository
from app.repositories.event_type_repo import EventTypeRepository
from app.repositories.availability_repo import AvailabilityRepository
from app.services.booking_service import BookingService
from app.schemas.booking import BookingCreate, BookingReschedule, BookingResponse

router = APIRouter(prefix="/api/bookings", tags=["Bookings"])


def get_service(db: Session = Depends(get_db)) -> BookingService:
    return BookingService(
        BookingRepository(db),
        EventTypeRepository(db),
        AvailabilityRepository(db),
    )


def _to_response(booking) -> dict:
    """Convert a Booking ORM object to a response-friendly dict."""
    return {
        "id": booking.id,
        "event_type_id": booking.event_type_id,
        "booker_name": booking.booker_name,
        "booker_email": booking.booker_email,
        "start_time": booking.start_time,
        "end_time": booking.end_time,
        "status": booking.status,
        "timezone": booking.timezone,
        "custom_responses": booking.custom_responses or {},
        "created_at": booking.created_at,
        "event_title": booking.event_type.title if booking.event_type else None,
        "event_duration": booking.event_type.duration_minutes if booking.event_type else None,
    }


@router.get("", response_model=list[BookingResponse])
def list_bookings(
    tab: str = Query("upcoming", regex="^(upcoming|past|cancelled)$"),
    service: BookingService = Depends(get_service),
):
    """List bookings filtered by tab: upcoming, past, or cancelled."""
    if tab == "upcoming":
        bookings = service.list_upcoming()
    elif tab == "past":
        bookings = service.list_past()
    else:
        bookings = service.list_cancelled()
    return [_to_response(b) for b in bookings]


@router.post("", response_model=BookingResponse, status_code=201)
def create_booking(
    data: BookingCreate,
    service: BookingService = Depends(get_service),
):
    """Create a new booking."""
    booking = service.create_booking(data)
    # Reload to get the relationship
    booking = service.get_booking(booking.id)
    return _to_response(booking)


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: int,
    service: BookingService = Depends(get_service),
):
    """Get booking by ID."""
    booking = service.get_booking(booking_id)
    return _to_response(booking)


@router.patch("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking(
    booking_id: int,
    service: BookingService = Depends(get_service),
):
    """Cancel a booking."""
    booking = service.cancel_booking(booking_id)
    return _to_response(booking)


@router.patch("/{booking_id}/reschedule", response_model=BookingResponse)
def reschedule_booking(
    booking_id: int,
    data: BookingReschedule,
    service: BookingService = Depends(get_service),
):
    """Reschedule a booking to a new time."""
    booking = service.reschedule_booking(booking_id, data)
    booking = service.get_booking(booking.id)
    return _to_response(booking)


@router.get("/slots/{slug}")
def get_available_slots(
    slug: str,
    date: date = Query(...),
    exclude_booking: Optional[int] = Query(None),
    service: BookingService = Depends(get_service),
):
    """Get available time slots for a specific event type and date."""
    return service.get_available_slots(slug, date, exclude_booking)
