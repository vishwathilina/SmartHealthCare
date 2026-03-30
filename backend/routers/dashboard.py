from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(db: Session = Depends(get_db)):
    total_requests = db.query(func.count(models.ServiceRequest.id)).scalar() or 0

    today = datetime.now(timezone.utc).date()
    critical_today = (
        db.query(func.count(models.ServiceRequest.id))
        .filter(models.ServiceRequest.priority == "CRITICAL")
        .filter(func.date(models.ServiceRequest.created_at) == today)
        .scalar()
        or 0
    )

    alerts_sent = db.query(func.count(models.AlertLog.id)).scalar() or 0
    active_profiles = db.query(func.count(models.HealthProfile.id)).scalar() or 0

    recent = (
        db.query(models.ServiceRequest, models.HealthProfile.label)
        .join(models.HealthProfile, models.HealthProfile.id == models.ServiceRequest.profile_id)
        .order_by(models.ServiceRequest.created_at.desc())
        .limit(5)
        .all()
    )

    recent_requests = [
        schemas.RecentRequestOut(
            request_id=req.id,
            title=req.title,
            priority=req.priority,
            status=req.status,
            profile_name=profile_label,
            created_at=req.created_at,
        )
        for req, profile_label in recent
    ]

    return schemas.DashboardOut(
        total_requests=total_requests,
        critical_today=critical_today,
        alerts_sent=alerts_sent,
        active_profiles=active_profiles,
        recent_requests=recent_requests,
    )
