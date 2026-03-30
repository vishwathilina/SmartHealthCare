from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.post("", response_model=schemas.ProfileOut)
def create_profile(payload: schemas.ProfileCreate, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = models.HealthProfile(**payload.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("", response_model=list[schemas.ProfileOut])
def list_profiles(db: Session = Depends(get_db)):
    return db.query(models.HealthProfile).order_by(models.HealthProfile.updated_at.desc()).all()


@router.get("/{profile_id}", response_model=schemas.ProfileOut)
def get_profile(profile_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/{profile_id}", response_model=schemas.ProfileOut)
def update_profile(
    profile_id: UUID,
    payload: schemas.ProfileUpdate,
    db: Session = Depends(get_db),
):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/{profile_id}")
def delete_profile(profile_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    db.delete(profile)
    db.commit()
    return {"ok": True}
