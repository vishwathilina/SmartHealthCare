from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from dependencies import get_current_caregiver
from gemini_service import build_prompt, call_gemini
from utils import save_base64_image
from rule_engine import compute_rule_severity

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=schemas.ChatOut)
async def chat(
    payload: schemas.ChatIn,
    db: Session = Depends(get_db),
    caregiver=Depends(get_current_caregiver),
):
    profile = (
        db.query(models.HealthProfile)
        .filter(models.HealthProfile.id == payload.profile_id, models.HealthProfile.user_id == caregiver.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    request = None
    if payload.request_id:
        request = (
            db.query(models.ServiceRequest)
            .filter(models.ServiceRequest.id == payload.request_id)
            .first()
        )
        if not request:
            raise HTTPException(status_code=404, detail="Request not found")
        if request.profile_id != profile.id or profile.user_id != caregiver.id:
            raise HTTPException(status_code=400, detail="request_id does not belong to profile_id")
    else:
        request = models.ServiceRequest(
            profile_id=profile.id,
            title=payload.message[:60],
            description=payload.message,
            status="NEW",
        )
        db.add(request)
        db.flush()

    already_alerted = bool(getattr(request, "alert_sent", False))

    media_url = None
    if payload.image_base64:
        media_url = save_base64_image(payload.image_base64, prefix=f"chat_{request.id}")

    user_message = models.ChatMessage(
        request_id=request.id,
        role="user",
        content=payload.message,
        media_url=media_url,
    )
    db.add(user_message)

    prompt = build_prompt(profile=profile, message=payload.message, has_image=bool(payload.image_base64))
    triage_result = await call_gemini(
        prompt=prompt,
        image_base64=payload.image_base64,
    )

    # Rule-based severity boosting using the patient's profile + message.
    rule = compute_rule_severity(
        profile={
            "daily_sugar": profile.daily_sugar,
            "resting_hr": profile.resting_hr,
            "allergies": profile.allergies,
        },
        message=payload.message,
    )
    gemini_score = int(triage_result.get("severity_score", 5))
    final_score = max(gemini_score, int(rule.get("severity_score", 0)))

    if final_score >= 7:
        final_priority = "CRITICAL"
    elif final_score >= 4:
        final_priority = "HIGH"
    elif final_score >= 2:
        final_priority = "MEDIUM"
    else:
        final_priority = "LOW"

    triage_result["severity_score"] = final_score
    triage_result["priority"] = final_priority
    triage_result["alert_hospital"] = final_score >= 7
    if rule.get("suggested_action"):
        # If rules indicate red flags, prefer a more urgent suggested action.
        if rule.get("alert_hospital") and (rule["suggested_action"] not in [None, ""]):
            triage_result["suggested_action"] = rule["suggested_action"]

    request.ai_response = triage_result["response"]
    request.suggested_action = triage_result["suggested_action"]
    request.severity_score = triage_result["severity_score"]
    request.priority = triage_result["priority"]
    request.category = triage_result["category"]

    # Assign the alert to the caregiver-selected hospital for this profile.
    if request.severity_score >= 7:
        request.priority = "CRITICAL"
        request.alert_sent = True
        if not already_alerted:
            assignment = (
                db.query(models.ProfileHospitalAssignment)
                .filter(models.ProfileHospitalAssignment.profile_id == profile.id)
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
                hospital_name = hospital_account.hospital_name if hospital_account else hospital_name

            # Create a hospital alert record immediately (auto-send behavior).
            db.add(
                models.AlertLog(
                    request_id=request.id,
                    hospital_user_id=hospital_user_id,
                    hospital_name=hospital_name,
                    summary=triage_result.get("summary"),
                    image_url=media_url,
                    status="SENT",
                )
            )
    else:
        request.alert_sent = False

    assistant_message = models.ChatMessage(
        request_id=request.id,
        role="assistant",
        content=request.ai_response,
    )
    db.add(assistant_message)

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
