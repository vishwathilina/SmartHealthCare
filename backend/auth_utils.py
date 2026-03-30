import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models

# bcrypt can break with certain Windows wheels/version combinations.
# pbkdf2_sha256 is reliable and avoids bcrypt native deps.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


def _get_env(name: str, default: str) -> str:
    value = os.getenv(name)
    return value if value else default


def get_pin_secret() -> str:
    return _get_env("PIN_SECRET", "dev-change-me-pin-secret")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def hash_pin(pin: str) -> str:
    """
    Deterministic PIN hashing so we can look up by PIN.
    We use HMAC-SHA256 with a server secret.
    """
    secret = get_pin_secret().encode("utf-8")
    msg = pin.strip().encode("utf-8")
    digest = hmac.new(secret, msg, hashlib.sha256).hexdigest()
    return digest


def create_access_token(subject_user_id: str, role: str, *, expires_minutes: int = 60 * 24) -> str:
    jwt_secret = _get_env("JWT_SECRET", "dev-change-me-jwt-secret")
    jwt_alg = _get_env("JWT_ALG", "HS256")
    now = datetime.now(timezone.utc)
    payload: dict[str, Any] = {
        "sub": subject_user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": now + timedelta(minutes=expires_minutes),
    }
    return jwt.encode(payload, jwt_secret, algorithm=jwt_alg)


def decode_access_token(token: str) -> dict[str, Any]:
    jwt_secret = _get_env("JWT_SECRET", "dev-change-me-jwt-secret")
    jwt_alg = _get_env("JWT_ALG", "HS256")
    return jwt.decode(token, jwt_secret, algorithms=[jwt_alg])


def get_user_role_and_record(db: Session, user_id, role: str):
    """
    Returns the User row if the role matches the account table.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None, None

    if role == "caregiver":
        caregiver = db.query(models.CaregiverAccount).filter(models.CaregiverAccount.user_id == user_id).first()
        return user, caregiver

    if role == "hospital":
        hospital = db.query(models.HospitalAccount).filter(models.HospitalAccount.user_id == user_id).first()
        return user, hospital

    return None, None


def normalize_authorization_header(value: str | None) -> str | None:
    if not value:
        return None
    parts = value.split()
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1]
    return None

