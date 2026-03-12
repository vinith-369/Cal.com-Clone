"""Service layer for Availability business logic."""

from fastapi import HTTPException

from app.repositories.availability_repo import AvailabilityRepository
from app.schemas.availability import (
    AvailabilityScheduleCreate,
    AvailabilityScheduleUpdate,
    DateOverrideCreate,
)


class AvailabilityService:
    """Centralizes validation and business rules for availability."""

    def __init__(self, repo: AvailabilityRepository):
        self.repo = repo

    def list_all(self):
        return self.repo.get_all_schedules()

    def get_by_id(self, schedule_id: int):
        schedule = self.repo.get_schedule_by_id(schedule_id)
        if not schedule:
            raise HTTPException(status_code=404, detail="Availability schedule not found")
        return schedule

    def get_default(self):
        return self.repo.get_default_schedule()

    def create(self, data: AvailabilityScheduleCreate):
        schedule_data = data.model_dump(exclude={"rules"})
        rules = [r.model_dump() for r in data.rules]
        return self.repo.create_schedule(schedule_data, rules)

    def update(self, schedule_id: int, data: AvailabilityScheduleUpdate):
        schedule = self.get_by_id(schedule_id)
        update_data = data.model_dump(exclude={"rules"}, exclude_unset=True)
        rules = None
        if data.rules is not None:
            rules = [r.model_dump() for r in data.rules]
        return self.repo.update_schedule(schedule, update_data, rules)

    def delete(self, schedule_id: int):
        schedule = self.get_by_id(schedule_id)
        self.repo.delete_schedule(schedule)

    def add_override(self, schedule_id: int, data: DateOverrideCreate):
        self.get_by_id(schedule_id)  # Validate schedule exists
        return self.repo.create_override(schedule_id, data.model_dump())

    def remove_override(self, schedule_id: int, override_id: int):
        self.get_by_id(schedule_id)  # Validate schedule exists
        success = self.repo.delete_override(override_id)
        if not success:
            raise HTTPException(status_code=404, detail="Date override not found")
