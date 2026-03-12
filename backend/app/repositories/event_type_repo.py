"""Repository for Event Type data access."""

from sqlalchemy.orm import Session, joinedload

from app.models.event_type import EventType
from app.models.custom_question import CustomQuestion


class EventTypeRepository:
    """Encapsulates all database operations for EventType."""

    def __init__(self, db: Session):
        self.db = db

    def get_all(self) -> list[EventType]:
        return (
            self.db.query(EventType)
            .options(joinedload(EventType.custom_questions))
            .order_by(EventType.created_at.desc())
            .all()
        )

    def get_by_id(self, event_type_id: int) -> EventType | None:
        return (
            self.db.query(EventType)
            .options(joinedload(EventType.custom_questions))
            .filter(EventType.id == event_type_id)
            .first()
        )

    def get_by_slug(self, slug: str) -> EventType | None:
        return (
            self.db.query(EventType)
            .options(joinedload(EventType.custom_questions))
            .filter(EventType.slug == slug)
            .first()
        )

    def create(self, data: dict, custom_questions: list[dict] | None = None) -> EventType:
        event_type = EventType(**data)
        self.db.add(event_type)
        self.db.flush()  # get the ID

        if custom_questions:
            for i, q in enumerate(custom_questions):
                q["sort_order"] = q.get("sort_order", i)
                question = CustomQuestion(event_type_id=event_type.id, **q)
                self.db.add(question)

        self.db.commit()
        self.db.refresh(event_type)
        return event_type

    def update(self, event_type: EventType, data: dict, custom_questions: list[dict] | None = None) -> EventType:
        for key, value in data.items():
            if value is not None:
                setattr(event_type, key, value)

        if custom_questions is not None:
            # Replace all custom questions
            self.db.query(CustomQuestion).filter(
                CustomQuestion.event_type_id == event_type.id
            ).delete()
            for i, q in enumerate(custom_questions):
                q["sort_order"] = q.get("sort_order", i)
                question = CustomQuestion(event_type_id=event_type.id, **q)
                self.db.add(question)

        self.db.commit()
        self.db.refresh(event_type)
        return event_type

    def delete(self, event_type: EventType) -> None:
        self.db.delete(event_type)
        self.db.commit()
