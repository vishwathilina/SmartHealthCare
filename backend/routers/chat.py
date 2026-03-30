from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from gemini_service import build_prompt, call_gemini
from utils import save_base64_image

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=schemas.ChatOut)
async def chat(payload: schemas.ChatIn, db: Session = Depends(get_db)):
    profile = db.query(models.HealthProfile).filter(models.HealthProfile.id == payload.profile_id).first()
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
        if request.profile_id != profile.id:
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
    triage_result = await call_gemini(prompt=prompt, image_base64=payload.image_base64)

    request.ai_response = triage_result["response"]
    request.suggested_action = triage_result["suggested_action"]
    request.severity_score = triage_result["severity_score"]
    request.priority = triage_result["priority"]
    request.category = triage_result["category"]

    if request.severity_score >= 7:
        request.priority = "CRITICAL"
        request.alert_sent = True
        db.add(
            models.AlertLog(
                request_id=request.id,
                hospital_name="General Hospital",
                summary=triage_result.get("summary"),
                image_url=media_url,
                status="PENDING",
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
