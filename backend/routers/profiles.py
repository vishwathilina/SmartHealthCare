from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from dependencies import get_current_caregiver

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post("", response_model=schemas.ProfileOut)
def create_profile(payload: schemas.ProfileCreate, db: Session = Depends(get_db), caregiver=Depends(get_current_caregiver)):
    profile = models.HealthProfile(**payload.model_dump(exclude={"user_id"}), user_id=caregiver.id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    assignment = (
        db.query(models.ProfileHospitalAssignment)
        .filter(models.ProfileHospitalAssignment.profile_id == profile.id)
        .first()
    )
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
        hospital_user_id=assignment.hospital_user_id if assignment else None,
    )


@router.get("", response_model=list[schemas.ProfileOut])
def list_profiles(db: Session = Depends(get_db), caregiver=Depends(get_current_caregiver)):
    profiles = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.user_id == caregiver.id)
        .order_by(models.HealthProfile.updated_at.desc())
        .all()
    )
    out: list[schemas.ProfileOut] = []
    for p in profiles:
        assignment = (
            db.query(models.ProfileHospitalAssignment)
            .filter(models.ProfileHospitalAssignment.profile_id == p.id)
            .first()
        )
        out.append(
            schemas.ProfileOut(
                id=p.id,
                user_id=p.user_id,
                label=p.label,
                age=p.age,
                weight_kg=p.weight_kg,
                height_cm=p.height_cm,
                blood_type=p.blood_type,
                daily_sugar=p.daily_sugar,
                resting_hr=p.resting_hr,
                allergies=p.allergies,
                conditions=p.conditions,
                medications=p.medications,
                updated_at=p.updated_at,
                hospital_user_id=assignment.hospital_user_id if assignment else None,
            )
        )
    return out


@router.get("/{profile_id}", response_model=schemas.ProfileOut)
def get_profile(profile_id: UUID, db: Session = Depends(get_db), caregiver=Depends(get_current_caregiver)):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != caregiver.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    assignment = (
        db.query(models.ProfileHospitalAssignment)
        .filter(models.ProfileHospitalAssignment.profile_id == profile.id)
        .first()
    )
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
        hospital_user_id=assignment.hospital_user_id if assignment else None,
    )


@router.put("/{profile_id}", response_model=schemas.ProfileOut)
def update_profile(
    profile_id: UUID,
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
    caregiver=Depends(get_current_caregiver),
):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != caregiver.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "user_id":
            continue
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    assignment = (
        db.query(models.ProfileHospitalAssignment)
        .filter(models.ProfileHospitalAssignment.profile_id == profile.id)
        .first()
    )
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
        hospital_user_id=assignment.hospital_user_id if assignment else None,
    )


@router.delete("/{profile_id}")
def delete_profile(profile_id: UUID, db: Session = Depends(get_db), caregiver=Depends(get_current_caregiver)):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != caregiver.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(profile)
    db.commit()
    return {"ok": True}


@router.get("/{profile_id}/emergency-contacts", response_model=list[schemas.EmergencyContactOut])
def list_emergency_contacts(
    profile_id: UUID,
    db: Session = Depends(get_db),
    caregiver=Depends(get_current_caregiver),
):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != caregiver.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.profile_id == profile_id).all()
    return [schemas.EmergencyContactOut(name=c.name, phone=c.phone, relation=c.relation) for c in contacts]


@router.post("/{profile_id}/emergency-contacts", response_model=schemas.EmergencyContactOut)
def add_emergency_contact(
    profile_id: UUID,
    payload: schemas.EmergencyContactsIn,
    db: Session = Depends(get_db),
    caregiver=Depends(get_current_caregiver),
):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if profile.user_id != caregiver.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    contact = models.EmergencyContact(
        profile_id=profile_id,
        name=payload.name.strip(),
        phone=payload.phone,
        relation=payload.relation,
    )
    db.add(contact)
    db.commit()
    return schemas.EmergencyContactOut(name=contact.name, phone=contact.phone, relation=contact.relation)
