"""Repository for Availability data access."""

from typing import Optional, List
from sqlalchemy.orm import Session, joinedload

from app.models.availability import AvailabilitySchedule, AvailabilityRule, DateOverride


class AvailabilityRepository:
    """Encapsulates all database operations for Availability."""

    def __init__(self, db: Session):
        self.db = db

    # ── Schedules ──────────────────────────────────────────

    def get_all_schedules(self) -> List[AvailabilitySchedule]:
        return (
            self.db.query(AvailabilitySchedule)
            .options(
                joinedload(AvailabilitySchedule.rules),
                joinedload(AvailabilitySchedule.overrides),
            )
            .order_by(AvailabilitySchedule.created_at.desc())
            .all()
        )

    def get_schedule_by_id(self, schedule_id: int) -> Optional[AvailabilitySchedule]:
        return (
            self.db.query(AvailabilitySchedule)
            .options(
                joinedload(AvailabilitySchedule.rules),
                joinedload(AvailabilitySchedule.overrides),
            )
            .filter(AvailabilitySchedule.id == schedule_id)
            .first()
        )

    def get_default_schedule(self) -> Optional[AvailabilitySchedule]:
        return (
            self.db.query(AvailabilitySchedule)
            .options(
                joinedload(AvailabilitySchedule.rules),
                joinedload(AvailabilitySchedule.overrides),
            )
            .filter(AvailabilitySchedule.is_default == True)
            .first()
        )

    def create_schedule(self, data: dict, rules: Optional[List[dict]] = None) -> AvailabilitySchedule:
        # If this is set as default, unset any existing default
        if data.get("is_default"):
            self.db.query(AvailabilitySchedule).filter(
                AvailabilitySchedule.is_default == True
            ).update({"is_default": False})

        schedule = AvailabilitySchedule(**data)
        self.db.add(schedule)
        self.db.flush()

        if rules:
            for rule_data in rules:
                rule = AvailabilityRule(schedule_id=schedule.id, **rule_data)
                self.db.add(rule)

        self.db.commit()
        self.db.refresh(schedule)
        return schedule

    def update_schedule(
        self, schedule: AvailabilitySchedule, data: dict, rules: Optional[List[dict]] = None
    ) -> AvailabilitySchedule:
        if data.get("is_default"):
            self.db.query(AvailabilitySchedule).filter(
                AvailabilitySchedule.is_default == True,
                AvailabilitySchedule.id != schedule.id,
            ).update({"is_default": False})

        for key, value in data.items():
            if value is not None:
                setattr(schedule, key, value)

        if rules is not None:
            # Replace all rules
            self.db.query(AvailabilityRule).filter(
                AvailabilityRule.schedule_id == schedule.id
            ).delete()
            for rule_data in rules:
                rule = AvailabilityRule(schedule_id=schedule.id, **rule_data)
                self.db.add(rule)

        self.db.commit()
        self.db.refresh(schedule)
        return schedule

    def delete_schedule(self, schedule: AvailabilitySchedule) -> None:
        self.db.delete(schedule)
        self.db.commit()

    # ── Date Overrides ──────────────────────────────────────

    def create_override(self, schedule_id: int, data: dict) -> DateOverride:
        override = DateOverride(schedule_id=schedule_id, **data)
        self.db.add(override)
        self.db.commit()
        self.db.refresh(override)
        return override

    def delete_override(self, override_id: int) -> bool:
        override = self.db.query(DateOverride).filter(DateOverride.id == override_id).first()
        if not override:
            return False
        self.db.delete(override)
        self.db.commit()
        return True
