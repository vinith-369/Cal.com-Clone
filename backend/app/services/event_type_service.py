"""Service layer for Event Type business logic."""

from fastapi import HTTPException

from app.repositories.event_type_repo import EventTypeRepository
from app.schemas.event_type import EventTypeCreate, EventTypeUpdate


class EventTypeService:
    """Centralizes validation and business rules for event types."""

    def __init__(self, repo: EventTypeRepository):
        self.repo = repo

    def list_all(self):
        return self.repo.get_all()

    def get_by_id(self, event_type_id: int):
        event_type = self.repo.get_by_id(event_type_id)
        if not event_type:
            raise HTTPException(status_code=404, detail="Event type not found")
        return event_type

    def get_by_slug(self, slug: str):
        event_type = self.repo.get_by_slug(slug)
        if not event_type:
            raise HTTPException(status_code=404, detail="Event type not found")
        return event_type

    def create(self, data: EventTypeCreate):
        # Validate slug uniqueness
        existing = self.repo.get_by_slug(data.slug)
        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")

        event_data = data.model_dump(exclude={"custom_questions"})
        questions = [q.model_dump() for q in data.custom_questions]
        return self.repo.create(event_data, questions)

    def update(self, event_type_id: int, data: EventTypeUpdate):
        event_type = self.get_by_id(event_type_id)

        # Check slug uniqueness if slug is being changed
        if data.slug and data.slug != event_type.slug:
            existing = self.repo.get_by_slug(data.slug)
            if existing:
                raise HTTPException(status_code=400, detail="Slug already exists")

        update_data = data.model_dump(exclude={"custom_questions"}, exclude_unset=True)
        questions = None
        if data.custom_questions is not None:
            questions = [q.model_dump() for q in data.custom_questions]

        return self.repo.update(event_type, update_data, questions)

    def delete(self, event_type_id: int):
        event_type = self.get_by_id(event_type_id)
        self.repo.delete(event_type)
