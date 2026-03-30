from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload

import models
import schemas
from database import get_db
from dependencies import get_current_caregiver, get_current_hospital

router = APIRouter(prefix="/hospitals", tags=["hospitals"])


@router.get("", response_model=list[schemas.HospitalOut])
def list_hospitals(db: Session = Depends(get_db), caregiver=Depends(get_current_caregiver)):
    hospitals = db.query(models.HospitalAccount).join(models.User).all()
    out: list[schemas.HospitalOut] = []
    for h in hospitals:
        out.append(
            schemas.HospitalOut(
                hospital_user_id=h.user_id,
                hospital_name=h.hospital_name,
                email=h.user.email if h.user else None,  # type: ignore[attr-defined]
            )
        )
    return out


@router.put("/profiles/{profile_id}/hospital", response_model=schemas.ProfileOut)
def assign_profile_hospital(
    profile_id: UUID,
    payload: schemas.HospitalAssignmentIn,
    db: Session = Depends(get_db),
    caregiver=Depends(get_current_caregiver),
):
    profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.id == profile_id, models.HealthProfile.user_id == caregiver.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    hospital_account = (
        db.query(models.HospitalAccount).filter(models.HospitalAccount.user_id == payload.hospital_user_id).first()
    )
    if not hospital_account:
        raise HTTPException(status_code=404, detail="Hospital not found")

    assignment = (
        db.query(models.ProfileHospitalAssignment)
        .filter(models.ProfileHospitalAssignment.profile_id == profile_id)
        .first()
    )
    if not assignment:
        db.add(models.ProfileHospitalAssignment(profile_id=profile_id, hospital_user_id=payload.hospital_user_id))
    else:
        assignment.hospital_user_id = payload.hospital_user_id

    db.commit()
    db.refresh(profile)

    return schemas.ProfileOut(
        id=profile.id,
        user_id=profile.user_id,
        label=profile.label,
        age=profile.age,
        weight_kg=profile.weight_kg,
        height_cm=profile.height_cm,
        blood_type=profile.blood_type,
        daily_sugar=profile.daily_sugar,
        resting_hr=profile.resting_hr,
        allergies=profile.allergies,
        conditions=profile.conditions,
        medications=profile.medications,
        updated_at=profile.updated_at,
        hospital_user_id=payload.hospital_user_id,
    )


@router.get("/me/alerts", response_model=list[schemas.AlertLogWithContext])
def list_my_hospital_alerts(
    db: Session = Depends(get_db),
    hospital=Depends(get_current_hospital),
):
    alerts = (
        db.query(models.AlertLog)
        .options(
            joinedload(models.AlertLog.request).joinedload(models.ServiceRequest.profile),
        )
        .filter(models.AlertLog.hospital_user_id == hospital.id)
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

