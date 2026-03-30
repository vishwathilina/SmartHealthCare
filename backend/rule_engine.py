import re
from typing import Any


def _contains_any(text: str, keywords: list[str]) -> bool:
    t = text.lower()
    return any(k in t for k in keywords)


def _extract_numeric(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def compute_rule_severity(profile: dict[str, Any], message: str) -> dict[str, Any]:
    """
    Lightweight rule-based triage boost. We don't replace Gemini; we
    only push severity up when the combination looks risky.
    """
    msg = message or ""
    t = msg.lower()

    score = 0
    reasons: list[str] = []

    # Symptom keyword boosts (not medical advice; for app triage demo)
    if _contains_any(t, ["chest pain", "pressure in chest", "tightness in chest"]):
        score = max(score, 9)
        reasons.append("Chest pain keywords detected")

    if _contains_any(t, ["shortness of breath", "can't breathe", "difficulty breathing"]):
        score = max(score, 9)
        reasons.append("Breathing difficulty keywords detected")

    if _contains_any(t, ["faint", "passed out", "unconscious", "syncope"]):
        score = max(score, 9)
        reasons.append("Fainting/unconscious keywords detected")

    if _contains_any(t, ["confused", "confusion", "disoriented", "not thinking clearly"]):
        score = max(score, 8)
        reasons.append("Confusion keywords detected")

    if _contains_any(t, ["severe abdominal pain", "severe belly pain", "worst stomach pain"]):
        score = max(score, 8)
        reasons.append("Severe abdominal pain keywords detected")

    if _contains_any(
        t,
        [
            "swelling",
            "throat swelling",
            "lip swelling",
            "face swelling",
            "hives",
            "anaphylaxis",
            "allergic reaction",
            "wheezing",
        ],
    ):
        score = max(score, 9)
        reasons.append("Allergic reaction / swelling keywords detected")

    # Profile vitals boosts
    sugar = _extract_numeric(profile.get("daily_sugar"))
    if sugar is not None:
        # mmol/L rough ranges
        if sugar >= 16:
            score = max(score, 8)
            reasons.append("Very high blood sugar in profile")
        if sugar <= 3.9:
            score = max(score, 8)
            reasons.append("Very low blood sugar in profile")

    hr = _extract_numeric(profile.get("resting_hr"))
    if hr is not None:
        if hr >= 120:
            score = max(score, 7)
            reasons.append("High resting heart rate in profile")
        if hr <= 40:
            score = max(score, 7)
            reasons.append("Low resting heart rate in profile")

    # Medication/allergy mismatch hint
    allergies = str(profile.get("allergies") or "").strip().lower()
    if allergies and _contains_any(t, ["itching", "rash"]):
        score = max(score, 7)
        reasons.append("Possible allergy-related symptoms detected")

    priority = "LOW"
    if score >= 7:
        priority = "CRITICAL"
    elif score >= 4:
        priority = "HIGH"
    elif score >= 2:
        priority = "MEDIUM"

    rule_summary = "Rule-based red flags detected. Consider urgent medical evaluation."
    if not reasons:
        rule_summary = "No major rule-based red flags detected based on symptoms and profile."

    suggested_action = (
        "Seek emergency care immediately or contact local emergency services if symptoms worsen or are severe."
        if score >= 7
        else "Monitor symptoms closely and consult a clinician for proper assessment."
    )

    return {
        "severity_score": score,
        "priority": priority,
        "rule_summary": rule_summary,
        "reasons": reasons,
        "suggested_action": suggested_action,
        "alert_hospital": score >= 7,
    }

