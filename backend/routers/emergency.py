import os
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth_utils import hash_pin
from database import get_db
from gemini_service import build_prompt, call_gemini
from rule_engine import compute_rule_severity
from utils import save_base64_image

router = APIRouter(prefix="/emergency", tags=["emergency"])


def _priority_from_score(score: int) -> str:
    if score >= 7:
        return "CRITICAL"
    if score >= 4:
        return "HIGH"
    if score >= 2:
        return "MEDIUM"
    return "LOW"


async def _transcribe_with_gemini(audio_base64: str, audio_mime_type: str | None) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return ""

    model = os.getenv("GEMINI_TRANSCRIBE_MODEL", "gemini-1.5-flash")
    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )

    cleaned = audio_base64.split(",", 1)[1] if "," in audio_base64 else audio_base64
    mime_type = audio_mime_type or "audio/wav"

    prompt = "Transcribe this audio exactly. Return only the transcript text."
    parts: list[dict[str, Any]] = [
        {"text": prompt},
        {"inlineData": {"mimeType": mime_type, "data": cleaned}},
    ]
    body = {"contents": [{"parts": parts}]}

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(endpoint, params={"key": api_key}, json=body)
            response.raise_for_status()
            data = response.json()
            # Gemini typically returns: candidates[0].content.parts[0].text
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return str(text).strip()
    except Exception:
        return ""


@router.post("/lookup", response_model=schemas.EmergencyLookupOut)
def lookup_emergency(payload: schemas.EmergencyLookupIn, db: Session = Depends(get_db)):
    """
    Public endpoint for emergency helpers: given the caregiver PIN, returns
    the elderly profiles + assigned hospital + emergency contacts.
    """
    pin_hash = hash_pin(payload.pin)

    caregiver = db.query(models.CaregiverAccount).filter(models.CaregiverAccount.pin_hash == pin_hash).first()
    if not caregiver:
        return schemas.EmergencyLookupOut(profiles=[])

    caregiver_user_id = caregiver.user_id
    profiles = db.query(models.HealthProfile).filter(models.HealthProfile.user_id == caregiver_user_id).all()

    out_profiles: list[schemas.EmergencyProfileOption] = []
    for p in profiles:
        assignment = (
            db.query(models.ProfileHospitalAssignment)
            .filter(models.ProfileHospitalAssignment.profile_id == p.id)
            .first()
        )
        hospital_name = None
        hospital_user_id = None
        if assignment:
            hospital_account = db.query(models.HospitalAccount).filter(models.HospitalAccount.user_id == assignment.hospital_user_id).first()
            hospital_name = hospital_account.hospital_name if hospital_account else None
            hospital_user_id = assignment.hospital_user_id

        contacts = (
            db.query(models.EmergencyContact)
            .filter(models.EmergencyContact.profile_id == p.id)
            .all()
        )
        contacts_out = [
            schemas.EmergencyContactOut(name=c.name, phone=c.phone, relation=c.relation) for c in contacts
        ]

        out_profiles.append(
            schemas.EmergencyProfileOption(
                profile_id=p.id,
                label=p.label,
                hospital_name=hospital_name,
                hospital_user_id=hospital_user_id,
                contacts=contacts_out,
            )
        )

    return schemas.EmergencyLookupOut(profiles=out_profiles)


@router.post("/request", response_model=schemas.ChatOut)
async def create_emergency_request(payload: schemas.EmergencyRequestIn, db: Session = Depends(get_db)):
    pin_hash = hash_pin(payload.pin)
    caregiver = db.query(models.CaregiverAccount).filter(models.CaregiverAccount.pin_hash == pin_hash).first()
    if not caregiver:
        raise HTTPException(status_code=403, detail="Invalid PIN")

    profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.id == payload.profile_id, models.HealthProfile.user_id == caregiver.user_id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    message = payload.message or ""
    if payload.audio_base64:
        transcript = await _transcribe_with_gemini(payload.audio_base64, payload.audio_mime_type)
        if transcript:
            message = transcript
    if not message.strip():
        raise HTTPException(status_code=400, detail="Missing message or audio")

    # Create a triage request + user message
    request = models.ServiceRequest(
        profile_id=profile.id,
        title=message[:60],
        description=message,
        status="NEW",
    )
    db.add(request)
    db.flush()

    media_url = None
    if payload.image_base64:
        media_url = save_base64_image(payload.image_base64, prefix=f"emergency_{request.id}")

    db.add(
        models.ChatMessage(
            request_id=request.id,
            role="user",
            content=message,
            media_url=media_url,
        )
    )

    prompt = build_prompt(profile=profile, message=message, has_image=bool(payload.image_base64))
    triage_result = await call_gemini(prompt=prompt, image_base64=payload.image_base64)

    # Apply rule-based severity boosts
    rule = compute_rule_severity(
        profile={
            "daily_sugar": profile.daily_sugar,
            "resting_hr": profile.resting_hr,
            "allergies": profile.allergies,
        },
        message=message,
    )

    gemini_score = int(triage_result.get("severity_score", 5))
    final_score = max(gemini_score, int(rule.get("severity_score", 0)))
    final_priority = _priority_from_score(final_score)

    triage_result["severity_score"] = final_score
    triage_result["priority"] = final_priority
    triage_result["alert_hospital"] = final_score >= 7

    if rule.get("alert_hospital") and rule.get("suggested_action"):
        triage_result["suggested_action"] = rule["suggested_action"]

    request.ai_response = triage_result["response"]
    request.suggested_action = triage_result["suggested_action"]
    request.severity_score = triage_result["severity_score"]
    request.priority = triage_result["priority"]
    request.category = triage_result["category"]

    # Emergency contacts (family)
    contacts = db.query(models.EmergencyContact).filter(models.EmergencyContact.profile_id == profile.id).all()
    contacts_text = ", ".join([f"{c.name} ({c.phone})" for c in contacts if c.phone or c.name]) or None

    if final_score >= 7:
        assignment = (
            db.query(models.ProfileHospitalAssignment)
            .filter(models.ProfileHospitalAssignment.profile_id == profile.id)
            .first()
        )
        hospital_name = "General Hospital"
        hospital_user_id = None
        if assignment:
            hospital_account = db.query(models.HospitalAccount).filter(models.HospitalAccount.user_id == assignment.hospital_user_id).first()
            hospital_user_id = assignment.hospital_user_id
            hospital_name = hospital_account.hospital_name if hospital_account else hospital_name

        summary = triage_result.get("summary") or "Critical medical event reported"
        if contacts_text:
            summary = f"{summary} Emergency contacts: {contacts_text}"

        request.alert_sent = True
        db.add(
            models.AlertLog(
                request_id=request.id,
                hospital_user_id=hospital_user_id,
                hospital_name=hospital_name,
                summary=summary,
                image_url=media_url,
                status="SENT",
            )
        )
    else:
        request.alert_sent = False

    db.add(
        models.ChatMessage(
            request_id=request.id,
            role="assistant",
            content=request.ai_response,
        )
    )

    db.commit()
    db.refresh(request)
    return schemas.ChatOut(
        request_id=request.id,
        message=request.ai_response,
        severity_score=request.severity_score,
        suggested_action=request.suggested_action,
        priority=request.priority,
        alert_sent=request.alert_sent,
        category=request.category,
    )

