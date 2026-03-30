from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from auth_utils import decode_access_token, get_user_role_and_record, normalize_authorization_header
from database import get_db


def get_token_payload(request: Request) -> dict:
    header = request.headers.get("Authorization")
    token = normalize_authorization_header(header)
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        return decode_access_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token") from None


def get_current_caregiver(request: Request, db: Session = Depends(get_db)):
    payload = get_token_payload(request)
    role = payload.get("role")
    user_id = payload.get("sub")
    if role != "caregiver" or not user_id:
        raise HTTPException(status_code=403, detail="Caregiver access required")

    user, caregiver = get_user_role_and_record(db, user_id, role)
    if not user or not caregiver:
        raise HTTPException(status_code=403, detail="Invalid caregiver")
    return user


def get_current_hospital(request: Request, db: Session = Depends(get_db)):
    payload = get_token_payload(request)
    role = payload.get("role")
    user_id = payload.get("sub")
    if role != "hospital" or not user_id:
        raise HTTPException(status_code=403, detail="Hospital access required")

    user, hospital = get_user_role_and_record(db, user_id, role)
    if not user or not hospital:
        raise HTTPException(status_code=403, detail="Invalid hospital")
    return user

