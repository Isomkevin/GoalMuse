"""
Opik tracing helper: use @track when Opik is configured, no-op otherwise.
Keeps agents runnable without opik installed or configured.
"""
import logging
import os

from app.config import settings

logger = logging.getLogger(__name__)


def _noop_decorator(f):
    return f


def _set_opik_env():
    """Ensure Opik env vars are set so traced calls are sent to Opik."""
    if settings.opik_api_key:
        os.environ.setdefault("OPIK_API_KEY", settings.opik_api_key)
    if settings.opik_workspace:
        os.environ.setdefault("OPIK_WORKSPACE", settings.opik_workspace)
    if settings.opik_project_name:
        os.environ.setdefault("OPIK_PROJECT_NAME", settings.opik_project_name)


def track_agent(name: str):
    """Decorator that wraps the function with opik.track when Opik is configured."""
    if not settings.opik_api_key:
        return _noop_decorator
    try:
        _set_opik_env()
        import opik
        return opik.track(name=name, project_name=settings.opik_project_name or "goal-muse")
    except Exception as e:
        logger.debug("Opik agent tracing disabled for %s: %s", name, e)
        return _noop_decorator


def get_current_trace_id() -> str | None:
    """Return the current Opik trace id when inside a @track context and Opik is configured."""
    if not settings.opik_api_key:
        return None
    try:
        _set_opik_env()
        from opik import opik_context
        headers = opik_context.get_distributed_trace_headers()
        if headers and isinstance(headers, dict):
            return headers.get("opik_trace_id")
    except Exception as e:
        logger.debug("Opik get_current_trace_id failed: %s", e)
    return None


def run_tracked_voice_transcribe(transcribe_fn, audio_bytes: bytes, filename: str, provider: str, model: str):
    """
    Run transcribe_fn(audio_bytes, filename) inside an Opik track span so Groq/OpenAI voice
    usage is monitored and evaluable. When Opik is configured, updates the span with
    input (audio size, provider, model), output (text length, preview), and on error error_info.
    Returns the same value as transcribe_fn, or re-raises.
    """
    if not settings.opik_api_key:
        return transcribe_fn(audio_bytes, filename)

    _set_opik_env()
    try:
        import opik
        from opik import opik_context
    except Exception as e:
        logger.debug("Opik voice tracing disabled: %s", e)
        return transcribe_fn(audio_bytes, filename)

    project = settings.opik_project_name or "goal-muse"
    span_name = "voice_transcribe"

    @opik.track(name=span_name, project_name=project)
    def _tracked():
        try:
            text = transcribe_fn(audio_bytes, filename)
            opik_context.update_current_span(
                name=span_name,
                input={
                    "audio_size_bytes": len(audio_bytes),
                    "filename": filename,
                    "provider": provider,
                    "model": model,
                },
                output={
                    "text_length": len(text),
                    "text_preview": text[:300] if text else "",
                },
                metadata={"voice_provider": provider, "model": model},
                provider=provider,
            )
            return text
        except Exception as e:
            opik_context.update_current_span(
                name=span_name,
                input={
                    "audio_size_bytes": len(audio_bytes),
                    "filename": filename,
                    "provider": provider,
                    "model": model,
                },
                metadata={"voice_provider": provider, "model": model},
                error_info={"message": str(e), "type": type(e).__name__},
            )
            raise

    return _tracked()
