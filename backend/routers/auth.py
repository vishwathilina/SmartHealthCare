import re
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth_utils import create_access_token, hash_password, hash_pin, verify_password
from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

Role = Literal["caregiver", "hospital"]


def _validate_pin(pin: str) -> str:
    pin = pin.strip()
    if not re.fullmatch(r"\d{6}", pin):
        raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")
    return pin


@router.post("/caregiver/register", response_model=schemas.TokenOut)
def caregiver_register(payload: schemas.CaregiverRegisterIn, db: Session = Depends(get_db)):
    pin = _validate_pin(payload.pin)

    existing = db.query(models.User).filter(models.User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    access_role: Role = "caregiver"
    password_hash = hash_password(payload.password)
    pin_hash = hash_pin(pin)

    # Deterministic PIN hashing means we can safely enforce uniqueness at write time.
    pin_conflict = db.query(models.CaregiverAccount).filter(models.CaregiverAccount.pin_hash == pin_hash).first()
    if pin_conflict:
        raise HTTPException(status_code=409, detail="PIN already in use")

    user = models.User(name=payload.name.strip(), email=payload.email.lower().strip())
    db.add(user)
    db.flush()

    db.add(
        models.CaregiverAccount(
            user_id=user.id,
            password_hash=password_hash,
            pin_hash=pin_hash,
        )
    )
    db.commit()

    token = create_access_token(str(user.id), access_role)
    return schemas.TokenOut(access_token=token)


@router.post("/hospital/register", response_model=schemas.TokenOut)
def hospital_register(payload: schemas.HospitalRegisterIn, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    access_role: Role = "hospital"
    password_hash = hash_password(payload.password)

    user = models.User(name=payload.hospital_name.strip(), email=payload.email.lower().strip())
    db.add(user)
    db.flush()

    db.add(
        models.HospitalAccount(
            user_id=user.id,
            password_hash=password_hash,
            hospital_name=payload.hospital_name.strip(),
        )
    )
    db.commit()

    token = create_access_token(str(user.id), access_role)
    return schemas.TokenOut(access_token=token)


def _login(role: Role, payload: schemas.LoginIn, db: Session) -> str:
    user = db.query(models.User).filter(models.User.email == payload.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if role == "caregiver":
        account = db.query(models.CaregiverAccount).filter(models.CaregiverAccount.user_id == user.id).first()
    else:
        account = db.query(models.HospitalAccount).filter(models.HospitalAccount.user_id == user.id).first()

    if not account or not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return create_access_token(str(user.id), role)


@router.post("/caregiver/login", response_model=schemas.TokenOut)
def caregiver_login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    token = _login("caregiver", payload, db)
    return schemas.TokenOut(access_token=token)


@router.post("/hospital/login", response_model=schemas.TokenOut)
def hospital_login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    token = _login("hospital", payload, db)
    return schemas.TokenOut(access_token=token)

