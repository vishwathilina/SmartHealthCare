import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter
from pydantic import BaseModel

load_dotenv()

MODEL = "gemini-3-flash-preview"
ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{MODEL}:generateContent"
)

voice_router = APIRouter(prefix="/voice", tags=["voice"])


class VoiceTranscribeIn(BaseModel):
    audio_base64: str
    audio_mime_type: str | None = None


def _strip_data_uri(value: str) -> str:
    if "," in value:
        return value.split(",", 1)[1]
    return value


@voice_router.post("/transcribe")
async def transcribe_audio(payload: VoiceTranscribeIn) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"transcript": "", "error": "use browser speech API"}

    transcribe_model = MODEL
    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{transcribe_model}:generateContent"
    )

    parts = [
        {"text": "Transcribe this audio exactly. Return only the transcript text."},
        {
            "inlineData": {
                "mimeType": payload.audio_mime_type or "audio/wav",
                "data": _strip_data_uri(payload.audio_base64),
            }
        },
    ]

    body = {"contents": [{"parts": parts}]}

    try:
        async with httpx.AsyncClient(timeout=35) as client:
            response = await client.post(endpoint, params={"key": api_key}, json=body)
            response.raise_for_status()
            data = response.json()
            content = data["candidates"][0]["content"]
            if isinstance(content, list):
                transcript = content[0]["parts"][0]["text"]
            else:
                transcript = content["parts"][0]["text"]
            return {"transcript": str(transcript).strip()}
    except Exception:
        return {"transcript": "", "error": "use browser speech API"}
