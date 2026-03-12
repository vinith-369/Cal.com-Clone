"""API router for Event Types."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.event_type_repo import EventTypeRepository
from app.services.event_type_service import EventTypeService
from app.schemas.event_type import (
    EventTypeCreate,
    EventTypeUpdate,
    EventTypeResponse,
    EventTypePublicResponse,
)

router = APIRouter(prefix="/api/event-types", tags=["Event Types"])


def get_service(db: Session = Depends(get_db)) -> EventTypeService:
    return EventTypeService(EventTypeRepository(db))


@router.get("", response_model=list[EventTypeResponse])
def list_event_types(service: EventTypeService = Depends(get_service)):
    """List all event types."""
    return service.list_all()


@router.post("", response_model=EventTypeResponse, status_code=201)
def create_event_type(
    data: EventTypeCreate,
    service: EventTypeService = Depends(get_service),
):
    """Create a new event type."""
    return service.create(data)


@router.get("/{event_type_id}", response_model=EventTypeResponse)
def get_event_type(
    event_type_id: int,
    service: EventTypeService = Depends(get_service),
):
    """Get event type by ID."""
    return service.get_by_id(event_type_id)


@router.put("/{event_type_id}", response_model=EventTypeResponse)
def update_event_type(
    event_type_id: int,
    data: EventTypeUpdate,
    service: EventTypeService = Depends(get_service),
):
    """Update an existing event type."""
    return service.update(event_type_id, data)


@router.delete("/{event_type_id}", status_code=204)
def delete_event_type(
    event_type_id: int,
    service: EventTypeService = Depends(get_service),
):
    """Delete an event type."""
    service.delete(event_type_id)


@router.get("/slug/{slug}/public", response_model=EventTypePublicResponse)
def get_public_event_type(
    slug: str,
    service: EventTypeService = Depends(get_service),
):
    """Get public event type info for the booking page."""
    return service.get_by_slug(slug)
