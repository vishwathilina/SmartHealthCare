import base64
from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any

from PIL import Image


class AlertService:
    def __init__(self, uploads_dir: str | None = None) -> None:
        base_dir = Path(__file__).resolve().parents[1]
        self.uploads_dir = Path(uploads_dir) if uploads_dir else (base_dir / "uploads")
        self.uploads_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def _strip_data_uri(value: str) -> str:
        if "," in value:
            return value.split(",", 1)[1]
        return value

    async def send_hospital_alert(
        self,
        request_id,
        profile,
        ai_result,
        image_base64: str | None = None,
    ) -> dict[str, Any]:
        now = datetime.now().isoformat(timespec="seconds")

        name = profile.get("name") or profile.get("label") or "Unknown Patient"
        age = profile.get("age", "N/A")
        blood_type = profile.get("blood_type", "N/A")
        conditions = profile.get("conditions") or "None"
        allergies = profile.get("allergies") or "None"
        summary = ai_result.get("summary") or "Critical medical event reported"
        severity = ai_result.get("severity_score", "N/A")
        suggested_action = ai_result.get("suggested_action") or "Immediate clinical assessment"

        alert_message = (
            "URGENT MEDICAL ALERT\n"
            f"Patient: {name}, Age: {age}, Blood Type: {blood_type}\n"
            f"Conditions: {conditions}\n"
            f"Allergies: {allergies}\n"
            f"Situation: {summary}\n"
            f"Severity: {severity}/10\n"
            f"Suggested Action: {suggested_action}\n"
            f"Time: {now}"
        )

        image_path = None
        if image_base64:
            try:
                image_bytes = base64.b64decode(self._strip_data_uri(image_base64))
                image = Image.open(BytesIO(image_bytes)).convert("RGB")
                image_file = self.uploads_dir / f"{request_id}.jpg"
                image.save(image_file, format="JPEG", quality=90)
                image_path = str(image_file)
            except Exception:
                image_path = None

        print("\n=== SIMULATED HOSPITAL ALERT ===")
        print(alert_message)
        print("=== END ALERT ===\n")

        return {
            "success": True,
            "message": alert_message,
            "image_path": image_path,
        }
