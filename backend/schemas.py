from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProfileBase(BaseModel):
    # Optional for requests; backend will derive it from the authenticated caregiver.
    user_id: UUID | None = None
    label: str = "My Profile"
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    blood_type: Optional[str] = None
    daily_sugar: Optional[float] = None
    resting_hr: Optional[int] = None
    allergies: Optional[str] = None
    conditions: Optional[str] = None
    medications: Optional[str] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    user_id: Optional[UUID] = None
    label: Optional[str] = None
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    blood_type: Optional[str] = None
    daily_sugar: Optional[float] = None
    resting_hr: Optional[int] = None
    allergies: Optional[str] = None
    conditions: Optional[str] = None
    medications: Optional[str] = None


class ProfileOut(ProfileBase):
    id: UUID
    updated_at: datetime
    # Assigned hospital (one hospital per elderly profile).
    hospital_user_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestBase(BaseModel):
    profile_id: UUID
    title: Optional[str] = None
    description: Optional[str] = None


class ServiceRequestCreate(ServiceRequestBase):
    pass


class ServiceRequestOut(BaseModel):
    id: UUID
    profile_id: UUID
    title: Optional[str] = None
    description: Optional[str] = None
    category: str
    priority: str
    status: str
    severity_score: int
    ai_response: Optional[str] = None
    suggested_action: Optional[str] = None
    alert_sent: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatMessageOut(BaseModel):
    id: UUID
    request_id: UUID
    role: str
    content: str
    media_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ServiceRequestWithMessages(ServiceRequestOut):
    chat_messages: list[ChatMessageOut]


class UpdateStatusIn(BaseModel):
    status: str


class ChatIn(BaseModel):
    profile_id: UUID
    request_id: Optional[UUID] = None
    message: str
    image_base64: Optional[str] = None


class ChatOut(BaseModel):
    request_id: UUID
    message: str
    severity_score: int
    suggested_action: str
    priority: str
    alert_sent: bool
    category: str


class AlertCreate(BaseModel):
    request_id: UUID
    image_base64: Optional[str] = None


class AlertLogOut(BaseModel):
    id: UUID
    request_id: UUID
    hospital_name: str
    summary: Optional[str] = None
    image_url: Optional[str] = None
    status: str
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertLogWithContext(AlertLogOut):
    request_title: Optional[str] = None
    profile_id: UUID
    profile_label: Optional[str] = None


class EmergencyContactOut(BaseModel):
    name: str
    phone: str | None = None
    relation: str | None = None


class EmergencyProfileOption(BaseModel):
    profile_id: UUID
    label: str
    hospital_name: str | None = None
    hospital_user_id: UUID | None = None
    contacts: list[EmergencyContactOut] = []


class EmergencyLookupIn(BaseModel):
    pin: str


class EmergencyLookupOut(BaseModel):
    profiles: list[EmergencyProfileOption]


class EmergencyRequestIn(BaseModel):
    pin: str
    profile_id: UUID
    message: str | None = None
    image_base64: str | None = None
    audio_base64: str | None = None
    audio_mime_type: str | None = None


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginIn(BaseModel):
    email: str
    password: str


class CaregiverRegisterIn(BaseModel):
    name: str
    email: str
    password: str
    pin: str


class HospitalRegisterIn(BaseModel):
    hospital_name: str
    email: str
    password: str


class HospitalAssignmentIn(BaseModel):
    hospital_user_id: UUID


class EmergencyContactsIn(BaseModel):
    name: str
    phone: str | None = None
    relation: str | None = None


class HospitalOut(BaseModel):
    hospital_user_id: UUID
    hospital_name: str
    email: str | None = None


class RecentRequestOut(BaseModel):
    request_id: UUID
    title: Optional[str] = None
    priority: str
    status: str
    profile_name: Optional[str] = None
    created_at: datetime


class DashboardOut(BaseModel):
    total_requests: int
    critical_today: int
    alerts_sent: int
    active_profiles: int
    recent_requests: list[RecentRequestOut]
