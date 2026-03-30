import json
import os
from typing import Any

import httpx

SAFE_DEFAULT = {
    "severity_score": 5,
    "priority": "MEDIUM",
    "category": "GENERAL",
    "response": "I have received your message. Please consult a doctor for proper assessment.",
    "suggested_action": "Visit your nearest clinic or call your doctor.",
    "alert_hospital": False,
    "summary": "Patient reported symptoms, awaiting full assessment.",
}


def build_prompt(profile: Any, message: str, has_image: bool) -> str:
    return f"""System: You are a medical triage AI assistant. A patient is describing their symptoms.
You have access to their health profile and must factor it into your assessment.

Patient profile:
- Name: {profile.label or 'Patient'}
- Age: {profile.age}
- Weight: {profile.weight_kg}kg, Height: {profile.height_cm}cm
- Blood type: {profile.blood_type}
- Daily blood sugar: {profile.daily_sugar} mmol/L
- Resting heart rate: {profile.resting_hr} bpm
- Known allergies: {profile.allergies}
- Current conditions: {profile.conditions}
- Current medications: {profile.medications}

Patient message: \"{message}\"

{'The patient has also sent an image for analysis.' if has_image else ''}

Respond ONLY with a valid JSON object, no markdown, no explanation:
{{
  \"severity_score\": <integer 0-10>,
  \"priority\": \"<LOW|MEDIUM|HIGH|CRITICAL>\",
  \"category\": \"<CARDIAC|RESPIRATORY|NEUROLOGICAL|DIGESTIVE|DERMATOLOGY|GENERAL|EMERGENCY>\",
  \"response\": \"<your conversational response to the patient>\",
  \"suggested_action\": \"<what the patient or doctor should do next>\",
  \"alert_hospital\": <true if severity_score >= 7, else false>,
  \"summary\": \"<one sentence patient summary for hospital if alerting>\"
}}"""


def _strip_markdown_fences(raw_text: str) -> str:
    text = raw_text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def normalize_triage_payload(payload: dict[str, Any]) -> dict[str, Any]:
    result = {**SAFE_DEFAULT, **payload}

    try:
        score = int(result.get("severity_score", SAFE_DEFAULT["severity_score"]))
    except (TypeError, ValueError):
        score = SAFE_DEFAULT["severity_score"]

    score = max(0, min(10, score))
    result["severity_score"] = score

    if score >= 7:
        result["priority"] = "CRITICAL"
        result["alert_hospital"] = True

    allowed_priorities = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    priority = str(result.get("priority", "MEDIUM")).upper()
    result["priority"] = priority if priority in allowed_priorities else "MEDIUM"

    allowed_categories = {
        "CARDIAC",
        "RESPIRATORY",
        "NEUROLOGICAL",
        "DIGESTIVE",
        "DERMATOLOGY",
        "GENERAL",
        "EMERGENCY",
    }
    category = str(result.get("category", "GENERAL")).upper()
    result["category"] = category if category in allowed_categories else "GENERAL"

    result["response"] = str(result.get("response", SAFE_DEFAULT["response"]))
    result["suggested_action"] = str(
        result.get("suggested_action", SAFE_DEFAULT["suggested_action"])
    )
    result["summary"] = str(result.get("summary", SAFE_DEFAULT["summary"]))
    result["alert_hospital"] = bool(result.get("alert_hospital", score >= 7))

    return result


async def call_gemini(
    prompt: str,
    image_base64: str | None = None,
    *,
    model: str | None = None,
) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return SAFE_DEFAULT

    # Hackathon MVP: always use the requested model.
    model = model or "gemini-3-flash-preview"

    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent?key={api_key}"
    )

    parts: list[dict[str, Any]] = [{"text": prompt}]
    if image_base64:
        parts.append(
            {
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": image_base64,
                }
            }
        )

    payload = {"contents": [{"parts": parts}]}

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            parsed = json.loads(_strip_markdown_fences(raw_text))
            return normalize_triage_payload(parsed)
    except Exception:  # noqa: BLE001
        return SAFE_DEFAULT
