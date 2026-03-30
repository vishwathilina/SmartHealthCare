from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import get_db
from utils import save_base64_image

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=schemas.AlertLogOut)
def create_alert(payload: schemas.AlertCreate, db: Session = Depends(get_db)):
    request = (
        db.query(models.ServiceRequest)
        .options(joinedload(models.ServiceRequest.profile))
        .filter(models.ServiceRequest.id == payload.request_id)
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")

    image_url = None
    if payload.image_base64:
        image_url = save_base64_image(payload.image_base64, prefix=f"alert_{request.id}")

    alert = models.AlertLog(
        request_id=request.id,
        hospital_name="General Hospital",
        summary=request.ai_response or "Manual alert sent for service request.",
        image_url=image_url,
        status="PENDING",
    )
    request.alert_sent = True

    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.get("", response_model=list[schemas.AlertLogWithContext])
def list_alerts(db: Session = Depends(get_db)):
    alerts = (
        db.query(models.AlertLog)
        .options(
            joinedload(models.AlertLog.request).joinedload(models.ServiceRequest.profile)
        )
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
