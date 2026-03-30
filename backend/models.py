import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    health_profiles = relationship("HealthProfile", back_populates="user", cascade="all, delete")

    caregiver_account = relationship(
        "CaregiverAccount", back_populates="user", uselist=False, cascade="all, delete"
    )
    hospital_account = relationship(
        "HospitalAccount", back_populates="user", uselist=False, cascade="all, delete"
    )


class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(100), nullable=False, default="My Profile")
    age = Column(Integer, nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    blood_type = Column(String(5), nullable=True)
    daily_sugar = Column(Float, nullable=True)
    resting_hr = Column(Integer, nullable=True)
    allergies = Column(Text, nullable=True)
    conditions = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="health_profiles")
    service_requests = relationship(
        "ServiceRequest", back_populates="profile", cascade="all, delete"
    )


class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(
        UUID(as_uuid=True), ForeignKey("health_profiles.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, default="GENERAL")
    priority = Column(String(20), nullable=False, default="LOW")
    status = Column(String(30), nullable=False, default="NEW")
    severity_score = Column(Integer, nullable=False, default=0)
    ai_response = Column(Text, nullable=True)
    suggested_action = Column(Text, nullable=True)
    alert_sent = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    profile = relationship("HealthProfile", back_populates="service_requests")
    alert_logs = relationship("AlertLog", back_populates="request", cascade="all, delete")
    chat_messages = relationship(
        "ChatMessage",
        back_populates="request",
        cascade="all, delete",
        order_by="ChatMessage.created_at",
    )


class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False
    )
    hospital_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    hospital_name = Column(String(200), nullable=False, default="General Hospital")
    summary = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="SENT")
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    request = relationship("ServiceRequest", back_populates="alert_logs")
    hospital = relationship("User")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(
        UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False
    )
    role = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    request = relationship("ServiceRequest", back_populates="chat_messages")


class CaregiverAccount(Base):
    __tablename__ = "caregiver_accounts"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    password_hash = Column(Text, nullable=False)
    pin_hash = Column(String(64), nullable=False)  # deterministic HMAC-SHA256 hex digest
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="caregiver_account")


class HospitalAccount(Base):
    __tablename__ = "hospital_accounts"

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    password_hash = Column(Text, nullable=False)
    hospital_name = Column(String(200), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="hospital_account")


class ProfileHospitalAssignment(Base):
    __tablename__ = "profile_hospital_assignments"

    profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("health_profiles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    hospital_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("health_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    name = Column(String(100), nullable=False)
    phone = Column(String(50), nullable=True)
    relation = Column(String(100), nullable=True)

