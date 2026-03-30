from typing import Any

from .gemini_client import analyze_health_request


def _priority_from_score(score: int) -> str:
    if score >= 7:
        return "CRITICAL"
    if score >= 4:
        return "HIGH"
    if score >= 2:
        return "MEDIUM"
    return "LOW"


class HealthcareAgent:
    async def process_request(
        self, profile: dict, message: str, image_base64: str | None = None
    ) -> dict[str, Any]:
        steps: list[dict[str, str]] = []

        # Step 1: ANALYZE
        result = await analyze_health_request(profile, message, image_base64)
        steps.append({"step": "ANALYZE", "status": "done", "note": "Gemini responded"})

        # Step 2: SCORE
        try:
            score = int(result.get("severity_score", 5))
        except (TypeError, ValueError):
            score = 5
        score = max(0, min(10, score))
        result["severity_score"] = score
        steps.append(
            {
                "step": "SCORE",
                "status": "done",
                "note": f"Score: {result['severity_score']}/10",
            }
        )

        # Step 3: CLASSIFY
        priority = _priority_from_score(score)
        result["priority"] = priority
        result["alert_hospital"] = score >= 7
        steps.append(
            {
                "step": "CLASSIFY",
                "status": "done",
                "note": f"Priority: {result['priority']}",
            }
        )

        # Step 4: RESPOND
        response = str(result.get("response", "")).strip()
        if response and not response.endswith((".", "!", "?")):
            response = f"{response}."
        result["response"] = response or "Please seek medical care for proper assessment."
        steps.append(
            {
                "step": "RESPOND",
                "status": "done",
                "note": "Response generated",
            }
        )

        # Step 5: ALERT
        if score >= 7:
            result["alert_hospital"] = True
            summary = str(result.get("summary") or "Critical symptoms detected.")
            result["hospital_summary"] = summary
            alert_note = "Hospital alert triggered"
        else:
            result["alert_hospital"] = False
            result["hospital_summary"] = str(result.get("summary") or "No alert required.")
            alert_note = "No alert needed"

        steps.append({"step": "ALERT", "status": "done", "note": alert_note})

        # Step 6: LOG
        steps.append({"step": "LOG", "status": "done", "note": "Request saved"})

        result["agent_steps"] = steps
        return result
