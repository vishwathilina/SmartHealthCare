from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import get_db

router = APIRouter(prefix="/requests", tags=["requests"])


@router.post("", response_model=schemas.ServiceRequestOut)
def create_service_request(payload: schemas.ServiceRequestCreate, db: Session = Depends(get_db)):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == payload.profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    request = models.ServiceRequest(
        profile_id=payload.profile_id,
        title=payload.title,
        description=payload.description,
        status="NEW",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("", response_model=list[schemas.ServiceRequestOut])
def list_service_requests(
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    category: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.ServiceRequest)

    if status:
        query = query.filter(models.ServiceRequest.status == status)
    if priority:
        query = query.filter(models.ServiceRequest.priority == priority)
    if category:
        query = query.filter(models.ServiceRequest.category == category)

    return query.order_by(models.ServiceRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=schemas.ServiceRequestWithMessages)
def get_service_request(request_id: UUID, db: Session = Depends(get_db)):
    request = (
        db.query(models.ServiceRequest)
        .options(joinedload(models.ServiceRequest.chat_messages))
        .filter(models.ServiceRequest.id == request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    request.chat_messages = sorted(request.chat_messages, key=lambda x: x.created_at)
    return request


@router.put("/{request_id}/status", response_model=schemas.ServiceRequestOut)
def update_request_status(
    request_id: UUID,
    payload: schemas.UpdateStatusIn,
    db: Session = Depends(get_db),
):
    request = db.query(models.ServiceRequest).filter(models.ServiceRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    request.status = payload.status
    db.commit()
    db.refresh(request)
    return request
