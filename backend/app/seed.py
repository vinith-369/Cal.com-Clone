"""Seed script — populates the database with sample data.

Usage: python -m app.seed
"""

from datetime import datetime, time, timedelta
from app.database import SessionLocal, engine, Base
from app.models.event_type import EventType
from app.models.availability import AvailabilitySchedule, AvailabilityRule, DateOverride
from app.models.booking import Booking
from app.models.custom_question import CustomQuestion


def seed():
    """Factory pattern: create sample data objects."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # Check if data already exists
        if db.query(EventType).count() > 0:
            print("⚠️  Database already has data. Skipping seed.")
            return

        print("🌱 Seeding database...")

        # ── 1. Create default availability schedule ──────────────
        schedule = AvailabilitySchedule(
            name="Working Hours",
            timezone="Asia/Kolkata",
            is_default=True,
        )
        db.add(schedule)
        db.flush()

        # Add Mon-Fri 9:00-17:00
        for day in range(5):  # 0=Mon to 4=Fri
            rule = AvailabilityRule(
                schedule_id=schedule.id,
                day_of_week=day,
                start_time=time(9, 0),
                end_time=time(17, 0),
            )
            db.add(rule)

        # ── 2. Create a second schedule ──────────────────────────
        schedule2 = AvailabilitySchedule(
            name="Extended Hours",
            timezone="Asia/Kolkata",
            is_default=False,
        )
        db.add(schedule2)
        db.flush()

        for day in range(6):  # Mon-Sat
            rule = AvailabilityRule(
                schedule_id=schedule2.id,
                day_of_week=day,
                start_time=time(8, 0),
                end_time=time(20, 0),
            )
            db.add(rule)

        # ── 3. Create event types ────────────────────────────────
        et1 = EventType(
            title="30 Minute Meeting",
            slug="30min",
            description="A quick 30-minute meeting to discuss anything.",
            duration_minutes=30,
            buffer_before=5,
            buffer_after=5,
            is_active=True,
            availability_schedule_id=schedule.id,
        )
        db.add(et1)

        et2 = EventType(
            title="Quick Chat",
            slug="quick-chat",
            description="A brief 15-minute catch-up call.",
            duration_minutes=15,
            buffer_before=0,
            buffer_after=5,
            is_active=True,
            availability_schedule_id=schedule.id,
        )
        db.add(et2)

        et3 = EventType(
            title="Consultation",
            slug="consultation",
            description="A full 60-minute consultation session for detailed discussion.",
            duration_minutes=60,
            buffer_before=10,
            buffer_after=10,
            is_active=True,
            availability_schedule_id=schedule.id,
        )
        db.add(et3)

        et4 = EventType(
            title="Technical Interview",
            slug="tech-interview",
            description="90-minute technical interview session.",
            duration_minutes=90,
            buffer_before=15,
            buffer_after=15,
            is_active=False,  # inactive for demo
            availability_schedule_id=schedule2.id,
        )
        db.add(et4)

        db.flush()

        # ── 4. Add custom questions to consultation ──────────────
        q1 = CustomQuestion(
            event_type_id=et3.id,
            label="What topics would you like to discuss?",
            type="textarea",
            required=True,
            sort_order=0,
        )
        q2 = CustomQuestion(
            event_type_id=et3.id,
            label="How did you hear about us?",
            type="select",
            required=False,
            options=["Google", "Social Media", "Referral", "Other"],
            sort_order=1,
        )
        db.add_all([q1, q2])

        # ── 5. Add a date override ──────────────────────────────
        # Block a specific date
        override = DateOverride(
            schedule_id=schedule.id,
            date=datetime(2026, 3, 25).date(),
            is_blocked=True,
        )
        db.add(override)

        # ── 6. Create sample bookings ────────────────────────────
        now = datetime.utcnow()
        # Upcoming booking
        upcoming_start = now + timedelta(days=2, hours=3)
        upcoming_start = upcoming_start.replace(minute=0, second=0, microsecond=0)
        b1 = Booking(
            event_type_id=et1.id,
            booker_name="Alice Johnson",
            booker_email="alice@example.com",
            start_time=upcoming_start,
            end_time=upcoming_start + timedelta(minutes=30),
            status="confirmed",
            timezone="Asia/Kolkata",
        )
        db.add(b1)

        # Another upcoming booking
        upcoming_start2 = now + timedelta(days=3, hours=5)
        upcoming_start2 = upcoming_start2.replace(minute=0, second=0, microsecond=0)
        b2 = Booking(
            event_type_id=et3.id,
            booker_name="Bob Smith",
            booker_email="bob@example.com",
            start_time=upcoming_start2,
            end_time=upcoming_start2 + timedelta(minutes=60),
            status="confirmed",
            timezone="America/New_York",
            custom_responses={
                "What topics would you like to discuss?": "Project architecture review",
                "How did you hear about us?": "Referral",
            },
        )
        db.add(b2)

        # Past booking
        past_start = now - timedelta(days=5, hours=2)
        past_start = past_start.replace(minute=0, second=0, microsecond=0)
        b3 = Booking(
            event_type_id=et2.id,
            booker_name="Charlie Brown",
            booker_email="charlie@example.com",
            start_time=past_start,
            end_time=past_start + timedelta(minutes=15),
            status="confirmed",
            timezone="Asia/Kolkata",
        )
        db.add(b3)

        # Cancelled booking
        cancelled_start = now + timedelta(days=1, hours=4)
        cancelled_start = cancelled_start.replace(minute=0, second=0, microsecond=0)
        b4 = Booking(
            event_type_id=et1.id,
            booker_name="Diana Prince",
            booker_email="diana@example.com",
            start_time=cancelled_start,
            end_time=cancelled_start + timedelta(minutes=30),
            status="cancelled",
            timezone="Europe/London",
        )
        db.add(b4)

        db.commit()
        print("✅ Seed data created successfully!")
        print(f"   📅 {4} event types")
        print(f"   🕐 {2} availability schedules")
        print(f"   📋 {4} bookings")
        print(f"   ❓ {2} custom questions")
        print(f"   🚫 {1} date override")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
