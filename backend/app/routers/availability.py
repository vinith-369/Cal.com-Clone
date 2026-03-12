
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.availability_repo import AvailabilityRepository
from app.services.availability_service import AvailabilityService
from app.schemas.availability import (
    AvailabilityScheduleCreate,
    AvailabilityScheduleUpdate,
    AvailabilityScheduleResponse,
    DateOverrideCreate,
    DateOverrideResponse,
)

router = APIRouter(prefix="/api/availability", tags=["Availability"])


def get_service(db: Session = Depends(get_db)) -> AvailabilityService:
    return AvailabilityService(AvailabilityRepository(db))


@router.get("", response_model=list[AvailabilityScheduleResponse])
def list_schedules(service: AvailabilityService = Depends(get_service)):
    """List all availability schedules."""
    return service.list_all()


@router.post("", response_model=AvailabilityScheduleResponse, status_code=201)
def create_schedule(
    data: AvailabilityScheduleCreate,
    service: AvailabilityService = Depends(get_service),
):
    """Create a new availability schedule."""
    return service.create(data)


@router.get("/{schedule_id}", response_model=AvailabilityScheduleResponse)
def get_schedule(
    schedule_id: int,
    service: AvailabilityService = Depends(get_service),
):
    """Get availability schedule by ID."""
    return service.get_by_id(schedule_id)


@router.put("/{schedule_id}", response_model=AvailabilityScheduleResponse)
def update_schedule(
    schedule_id: int,
    data: AvailabilityScheduleUpdate,
    service: AvailabilityService = Depends(get_service),
):
    """Update an availability schedule."""
    return service.update(schedule_id, data)


@router.delete("/{schedule_id}", status_code=204)
def delete_schedule(
    schedule_id: int,
    service: AvailabilityService = Depends(get_service),
):
    """Delete an availability schedule."""
    service.delete(schedule_id)


@router.post(
    "/{schedule_id}/overrides",
    response_model=DateOverrideResponse,
    status_code=201,
)
def add_date_override(
    schedule_id: int,
    data: DateOverrideCreate,
    service: AvailabilityService = Depends(get_service),
):
    """Add a date override (custom hours or blocked date)."""
    return service.add_override(schedule_id, data)


@router.delete("/{schedule_id}/overrides/{override_id}", status_code=204)
def remove_date_override(
    schedule_id: int,
    override_id: int,
    service: AvailabilityService = Depends(get_service),
):
    """Remove a date override."""
    service.remove_override(schedule_id, override_id)
