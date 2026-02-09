"""
Voice: STT via OpenAI Whisper or Groq (free tier). Optional; fails gracefully when no key.
Structured errors (code + message) so the frontend can show appropriate warnings.
When Opik is configured, Groq/OpenAI voice calls are traced and enriched for monitoring/evaluation.
"""
import io
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_user_id
from app.agents._opik import run_tracked_voice_transcribe
from app.config import settings

router = APIRouter(prefix="/voice", tags=["voice"])

# Error codes for frontend to show specific UI (quota, rate limit, not configured, etc.)
VOICE_NOT_CONFIGURED = "VOICE_NOT_CONFIGURED"
VOICE_QUOTA_EXCEEDED = "VOICE_QUOTA_EXCEEDED"
VOICE_RATE_LIMITED = "VOICE_RATE_LIMITED"
VOICE_PROVIDER_ERROR = "VOICE_PROVIDER_ERROR"


def _has_voice_config() -> bool:
    if (settings.voice_provider or "").lower() == "groq":
        return bool(settings.groq_api_key and settings.groq_api_key.strip())
    return bool(settings.openai_api_key and settings.openai_api_key.strip())


def _transcribe_openai(audio_bytes: bytes, filename: str) -> str:
    if not settings.openai_api_key:
        return ""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        file_like = io.BytesIO(audio_bytes)
        file_like.name = filename or "audio.m4a"
        r = client.audio.transcriptions.create(
            model="whisper-1",
            file=file_like,
        )
        return (r.text or "").strip()
    except Exception:
        return ""


def _transcribe_groq(audio_bytes: bytes, filename: str) -> str:
    if not settings.groq_api_key:
        return ""
    from groq import Groq
    client = Groq(api_key=settings.groq_api_key)
    name = filename or "audio.m4a"
    # Groq SDK accepts (filename, bytes) for file upload
    r = client.audio.transcriptions.create(
        file=(name, audio_bytes),
        model="whisper-large-v3-turbo",
        response_format="text",
    )
    return (r.text or "").strip()


def _transcribe(audio_bytes: bytes, filename: str) -> str:
    """Run STT with configured provider. Raises HTTPException on provider errors (e.g. Groq 429)."""
    provider = (settings.voice_provider or "groq").lower()
    if provider == "groq" and settings.groq_api_key:
        try:
            return _transcribe_groq(audio_bytes, filename)
        except Exception as e:
            _raise_groq_style_error(e)
    if settings.openai_api_key:
        return _transcribe_openai(audio_bytes, filename)
    return ""


def _raise_groq_style_error(e: Exception) -> None:
    """Map Groq (and OpenAI-compatible) API errors to HTTPException with code + message."""
    err_msg = str(e).lower()
    status_code = getattr(e, "status_code", None) or getattr(
        getattr(e, "response", None), "status_code", None
    )
    if status_code == 429 or "429" in err_msg or "rate limit" in err_msg or "too many requests" in err_msg:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": VOICE_RATE_LIMITED,
                "message": "Voice limit reached for now. Try again in a few minutes or add your text manually.",
            },
        )
    if status_code == 498 or "498" in err_msg or "capacity" in err_msg:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": VOICE_QUOTA_EXCEEDED,
                "message": "Voice service is at capacity. Try again later or type your message instead.",
            },
        )
    if status_code == 403 or "403" in err_msg or "forbidden" in err_msg or "quota" in err_msg or "limit" in err_msg:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": VOICE_QUOTA_EXCEEDED,
                "message": "Daily voice limit reached. Try again tomorrow or add your text manually.",
            },
        )
    if status_code == 401 or "401" in err_msg or "unauthorized" in err_msg:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": VOICE_PROVIDER_ERROR,
                "message": "Voice service is not configured correctly. Please try again later.",
            },
        )
    # Generic provider/server error
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": VOICE_PROVIDER_ERROR,
            "message": "Transcription failed. Try again or type your message instead.",
        },
    )


@router.post("/transcribe")
def transcribe(
    user_id: str = Depends(get_current_user_id),
    file: UploadFile = File(..., description="Audio file (m4a, mp3, wav, webm)"),
):
    """
    Transcribe audio to text using Groq (default) or OpenAI Whisper. Max ~25MB.
    Returns 503 with structured detail { "code", "message" } when voice is unavailable
    or when provider returns rate limit / quota errors (e.g. Groq free tier exceeded).
    """
    if not _has_voice_config():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": VOICE_NOT_CONFIGURED,
                "message": "Voice transcription is not configured. Set GROQ_API_KEY (or OPENAI_API_KEY) to enable.",
            },
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
    provider = (settings.voice_provider or "groq").lower()
    if provider == "groq" and settings.groq_api_key:
        model = "whisper-large-v3-turbo"
    else:
        provider = "openai"
        model = "whisper-1"
    try:
        text = run_tracked_voice_transcribe(_transcribe, body, filename, provider, model)
    except HTTPException:
        raise
    except Exception as e:
        _raise_groq_style_error(e)
    return {"text": text}
