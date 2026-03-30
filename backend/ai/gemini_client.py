import json
import os
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()

MODEL = "gemini-1.5-flash"
ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{MODEL}:generateContent"
)

SAFE_DEFAULT = {
    "severity_score": 5,
    "priority": "MEDIUM",
    "category": "GENERAL",
    "response": "I have received your message. Please consult a doctor for a proper assessment.",
    "suggested_action": "Visit your nearest clinic or contact your doctor.",
    "alert_hospital": False,
    "summary": "Patient reported symptoms and needs medical follow-up.",
}


def _extract_text(data: dict[str, Any]) -> str:
    candidates = data.get("candidates") or []
    if not candidates:
        raise ValueError("No candidates in Gemini response")

    content = candidates[0].get("content")
    if isinstance(content, dict):
        parts = content.get("parts") or []
        if parts and isinstance(parts[0], dict) and "text" in parts[0]:
            return str(parts[0]["text"])

    if isinstance(content, list) and content:
        first = content[0]
        if isinstance(first, dict):
            parts = first.get("parts") or []
            if parts and isinstance(parts[0], dict) and "text" in parts[0]:
                return str(parts[0]["text"])

    raise ValueError("Unable to extract text from Gemini response")


def _strip_data_uri(value: str) -> str:
    if "," in value:
        return value.split(",", 1)[1]
    return value


def _strip_markdown(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines).strip()
    return text


def _priority_from_score(score: int) -> str:
    if score >= 7:
        return "CRITICAL"
    if score >= 4:
        return "HIGH"
    if score >= 2:
        return "MEDIUM"
    return "LOW"


def _normalize_result(payload: dict[str, Any]) -> dict[str, Any]:
    result = {**SAFE_DEFAULT, **payload}

    try:
        score = int(result.get("severity_score", 5))
    except (TypeError, ValueError):
        score = 5
    score = max(0, min(10, score))

    result["severity_score"] = score
    result["priority"] = _priority_from_score(score)
    result["category"] = str(result.get("category", "GENERAL")).upper() or "GENERAL"
    result["response"] = str(result.get("response", SAFE_DEFAULT["response"]))
    result["suggested_action"] = str(
        result.get("suggested_action", SAFE_DEFAULT["suggested_action"])
    )
    result["alert_hospital"] = bool(result.get("alert_hospital", score >= 7))
    result["summary"] = str(result.get("summary", SAFE_DEFAULT["summary"]))

    return {
        "severity_score": result["severity_score"],
        "priority": result["priority"],
        "category": result["category"],
        "response": result["response"],
        "suggested_action": result["suggested_action"],
        "alert_hospital": result["alert_hospital"],
        "summary": result["summary"],
    }


def _build_prompt(profile: dict[str, Any], message: str, has_image: bool) -> str:
    name = profile.get("name") or profile.get("label") or "Patient"
    age = profile.get("age")
    weight_kg = profile.get("weight_kg")
    height_cm = profile.get("height_cm")
    blood_type = profile.get("blood_type")
    daily_sugar = profile.get("daily_sugar")
    resting_hr = profile.get("resting_hr")
    allergies = profile.get("allergies") or "None"
    conditions = profile.get("conditions") or "None"
    medications = profile.get("medications") or "None"

    image_note = "The patient has also sent an image for analysis." if has_image else ""

    return f"""System: You are a medical triage AI assistant. A patient is describing their symptoms.
You have access to their health profile and must factor it into your assessment.

Patient profile:
- Name: {name}
- Age: {age}
- Weight: {weight_kg}kg, Height: {height_cm}cm
- Blood type: {blood_type}
- Daily blood sugar: {daily_sugar} mmol/L
- Resting heart rate: {resting_hr} bpm
- Known allergies: {allergies}
- Current conditions: {conditions}
- Current medications: {medications}

Patient message: \"{message}\"

{image_note}

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


async def analyze_health_request(
    profile: dict, message: str, image_base64: str | None = None
) -> dict:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return SAFE_DEFAULT.copy()

    prompt = _build_prompt(profile=profile, message=message, has_image=bool(image_base64))

    parts: list[dict[str, Any]] = [{"text": prompt}]
    if image_base64:
        parts.append(
            {
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": _strip_data_uri(image_base64),
                }
            }
        )

    payload = {"contents": [{"parts": parts}]}

    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post(ENDPOINT, params={"key": api_key}, json=payload)
            response.raise_for_status()
            data = response.json()
            text = _extract_text(data)
    except Exception:
        return SAFE_DEFAULT.copy()

    try:
        parsed = json.loads(_strip_markdown(text))
        return _normalize_result(parsed)
    except Exception:
        return SAFE_DEFAULT.copy()
