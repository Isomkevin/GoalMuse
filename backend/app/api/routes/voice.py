"""
Voice: STT via OpenAI Whisper. Optional; fails gracefully when no API key.
"""
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_user_id
from app.config import settings

router = APIRouter(prefix="/voice", tags=["voice"])


def _transcribe_whisper(audio_bytes: bytes, filename: str) -> str:
    if not settings.openai_api_key:
        return ""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        # Whisper expects a file-like object; use filename extension for format
        import io
        file_like = io.BytesIO(audio_bytes)
        file_like.name = filename or "audio.m4a"
        r = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_like,
        )
        return (r.text or "").strip()
    except Exception:
        return ""


@router.post("/transcribe")
def transcribe(
    user_id: str = Depends(get_current_user_id),
    file: UploadFile = File(..., description="Audio file (m4a, mp3, wav, webm)"),
):
    """
    Transcribe audio to text using Whisper. Max ~25MB / ~10 min.
    Returns 503 if voice (Whisper) is not configured.
    """
    if not settings.openai_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Voice transcription is not configured. Set OPENAI_API_KEY to enable.",
        )
    content_type = (file.content_type or "").lower()
    allowed = {"audio/mpeg", "audio/mp4", "audio/mp3", "audio/x-m4a", "audio/m4a", "audio/wav", "audio/webm", "audio/ogg", "application/octet-stream"}
    if content_type and content_type not in allowed and not content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {content_type}. Use m4a, mp3, wav, or webm.",
        )
    try:
        body = file.file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read audio file",
        ) from e
    if not body or len(body) > 25 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio too large or empty (max 25MB)",
        )
    filename = file.filename or "audio.m4a"
    text = _transcribe_whisper(body, filename)
    return {"text": text}
