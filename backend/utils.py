import base64
import uuid
from io import BytesIO
from pathlib import Path

from fastapi import HTTPException
from PIL import Image

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _strip_data_uri_prefix(data: str) -> str:
    if "," in data:
        return data.split(",", 1)[1]
    return data


def save_base64_image(image_base64: str, prefix: str = "upload") -> str:
    try:
        cleaned = _strip_data_uri_prefix(image_base64)
        image_bytes = base64.b64decode(cleaned)
        image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail="Invalid image_base64 payload") from exc

    filename = f"{prefix}_{uuid.uuid4().hex}.jpg"
    output_path = UPLOADS_DIR / filename
    image.save(output_path, format="JPEG", quality=90)
    return f"/uploads/{filename}"
