from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import get_db
from utils import save_base64_image
from dependencies import get_current_caregiver

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=schemas.AlertLogOut)
def create_alert(
    payload: schemas.AlertCreate,
    db: Session = Depends(get_db),
    caregiver=Depends(get_current_caregiver),
):
    request = (
        db.query(models.ServiceRequest)
        .options(joinedload(models.ServiceRequest.profile))
        .filter(models.ServiceRequest.id == payload.request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if not request.profile or request.profile.user_id != caregiver.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    existing_alert = db.query(models.AlertLog).filter(models.AlertLog.request_id == request.id).first()
    if existing_alert:
        return existing_alert

    image_url = None
    if payload.image_base64:
        image_url = save_base64_image(payload.image_base64, prefix=f"alert_{request.id}")

    # Assign to the caregiver-selected hospital for the elderly profile.
    assignment = (
        db.query(models.ProfileHospitalAssignment)
        .filter(models.ProfileHospitalAssignment.profile_id == request.profile_id)
        .first()
    )
    hospital_name = "General Hospital"
    hospital_user_id = None
    if assignment:
        hospital_account = (
            db.query(models.HospitalAccount)
            .filter(models.HospitalAccount.user_id == assignment.hospital_user_id)
            .first()
        )
        hospital_user_id = assignment.hospital_user_id
        if hospital_account:
            hospital_name = hospital_account.hospital_name

    alert = models.AlertLog(
        request_id=request.id,
        hospital_user_id=hospital_user_id,
        hospital_name=hospital_name,
        summary=request.ai_response or "Manual alert sent for service request.",
        image_url=image_url,
        status="SENT",
    )
    request.alert_sent = True

    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("", response_model=list[schemas.AlertLogWithContext])
def list_alerts(db: Session = Depends(get_db), caregiver=Depends(get_current_caregiver)):
    alerts = (
        db.query(models.AlertLog)
        .options(
            joinedload(models.AlertLog.request).joinedload(models.ServiceRequest.profile)
        )
        .join(models.ServiceRequest, models.ServiceRequest.id == models.AlertLog.request_id)
        .join(models.HealthProfile, models.HealthProfile.id == models.ServiceRequest.profile_id)
        .filter(models.HealthProfile.user_id == caregiver.id)
        .order_by(models.AlertLog.sent_at.desc())
        .all()
    )

    response: list[schemas.AlertLogWithContext] = []
    for alert in alerts:
        profile = alert.request.profile if alert.request else None
        response.append(
            schemas.AlertLogWithContext(
                id=alert.id,
                request_id=alert.request_id,
                hospital_name=alert.hospital_name,
                hospital_user_id=alert.hospital_user_id,
                summary=alert.summary,
                image_url=alert.image_url,
                status=alert.status,
                sent_at=alert.sent_at,
                request_title=alert.request.title if alert.request else None,
                profile_id=profile.id if profile else None,
                profile_label=profile.label if profile else None,
            )
        )

    return response
