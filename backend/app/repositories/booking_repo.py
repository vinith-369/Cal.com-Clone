"""Repository for Booking data access."""

from datetime import datetime
from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_

from app.models.booking import Booking


class BookingRepository:
    """Encapsulates all database operations for Bookings."""

    def __init__(self, db: Session):
        self.db = db

    def get_all(self, status_filter: Optional[str] = None) -> List[Booking]:
        query = (
            self.db.query(Booking)
            .options(joinedload(Booking.event_type))
            .order_by(Booking.start_time.desc())
        )
        if status_filter:
            query = query.filter(Booking.status == status_filter)
        return query.all()

    def get_upcoming(self) -> list[Booking]:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        return (
            self.db.query(Booking)
            .options(joinedload(Booking.event_type))
            .filter(Booking.start_time > now, Booking.status == "confirmed")
            .order_by(Booking.start_time.asc())
            .all()
        )

    def get_past(self) -> list[Booking]:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        return (
            self.db.query(Booking)
            .options(joinedload(Booking.event_type))
            .filter(Booking.start_time <= now, Booking.status == "confirmed")
            .order_by(Booking.start_time.desc())
            .all()
        )

    def get_cancelled(self) -> list[Booking]:
        return (
            self.db.query(Booking)
            .options(joinedload(Booking.event_type))
            .filter(Booking.status == "cancelled")
            .order_by(Booking.start_time.desc())
            .all()
        )

    def get_by_id(self, booking_id: int) -> Optional[Booking]:
        return (
            self.db.query(Booking)
            .options(joinedload(Booking.event_type))
            .filter(Booking.id == booking_id)
            .first()
        )

    def get_bookings_for_date_range(
        self,
        event_type_id: int,
        start: datetime,
        end: datetime,
        exclude_booking_id: Optional[int] = None,
    ) -> List[Booking]:
        """Get confirmed bookings overlapping with the given range."""
        query = self.db.query(Booking).filter(
            Booking.status == "confirmed",
            Booking.start_time < end,
            Booking.end_time > start,
        )
        if exclude_booking_id:
            query = query.filter(Booking.id != exclude_booking_id)
        return query.all()

    def create(self, data: dict) -> Booking:
        booking = Booking(**data)
        self.db.add(booking)
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def update_status(self, booking: Booking, status: str) -> Booking:
        booking.status = status
        self.db.commit()
        self.db.refresh(booking)
        return booking

    def update_times(self, booking: Booking, start_time: datetime, end_time: datetime, timezone: str) -> Booking:
        booking.start_time = start_time
        booking.end_time = end_time
        booking.timezone = timezone
        self.db.commit()
        self.db.refresh(booking)
        return booking
