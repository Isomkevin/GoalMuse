"""
Single LLM interface. Low temperature for consistent, explainable outputs.
Supports OpenAI, OpenRouter, and Gemini via config.llm_provider.
Per-request overrides (e.g. user preference) via set_llm_override() / clear_llm_override().
Opik: when OPIK_API_KEY is set, traced calls are sent to Opik.
"""
import json
import logging
import os
import re
from contextvars import ContextVar

from app.config import settings

logger = logging.getLogger(__name__)

# Per-request override (e.g. from user LLM preference in settings). Keys: provider, model (optional).
_llm_override: ContextVar[dict | None] = ContextVar("llm_override", default=None)


def set_llm_override(provider: str | None = None, model: str | None = None) -> None:
    """Set provider/model for the current context (e.g. request). Use clear_llm_override() after."""
    if provider or model:
        _llm_override.set({"provider": provider or settings.llm_provider, "model": model})
    else:
        _llm_override.set(None)


def clear_llm_override() -> None:
    """Clear per-request override."""
    _llm_override.set(None)


def _get_effective_provider_and_model() -> tuple[str, str | None]:
    """Return (provider, model_override) for this context. model_override is None to use settings default."""
    ov = _llm_override.get()
    if ov:
        return (ov.get("provider") or settings.llm_provider or "openai", ov.get("model"))
    return (settings.llm_provider or "openai", None)

# Opik: set env so track_openai / track_genai use our project when configured
def _configure_opik_env():
    if settings.opik_api_key:
        os.environ.setdefault("OPIK_API_KEY", settings.opik_api_key)
    if settings.opik_workspace:
        os.environ.setdefault("OPIK_WORKSPACE", settings.opik_workspace)
    if settings.opik_project_name:
        os.environ.setdefault("OPIK_PROJECT_NAME", settings.opik_project_name)


def _complete_openai(system: str, user: str, model: str | None = None) -> str | None:
    """OpenAI completion with Opik tracing."""
    if not settings.openai_api_key:
        return None
    model = model or settings.openai_model
    try:
        from openai import OpenAI
        client = OpenAI(api_key=settings.openai_api_key)
        if settings.opik_api_key:
            _configure_opik_env()
            try:
                from opik.integrations.openai import track_openai
                client = track_openai(
                    client,
                    project_name=settings.opik_project_name or "goal-muse",
                )
            except Exception as e:
                logger.debug("Opik OpenAI tracing disabled: %s", e)
        r = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
        )
        if r.choices and r.choices[0].message.content:
            return r.choices[0].message.content.strip()
    except Exception:
        pass
    return None


def _complete_openrouter(system: str, user: str, model: str | None = None) -> str | None:
    """OpenRouter completion (OpenAI-compatible API) with Opik tracing."""
    if not settings.openrouter_api_key:
        return None
    model = model or settings.openrouter_model
    try:
        from openai import OpenAI
        client = OpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        if settings.opik_api_key:
            _configure_opik_env()
            try:
                from opik.integrations.openai import track_openai
                client = track_openai(
                    client,
                    project_name=settings.opik_project_name or "goal-muse",
                )
            except Exception as e:
                logger.debug("Opik OpenRouter tracing disabled: %s", e)
        r = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.2,
        )
        if r.choices and r.choices[0].message.content:
            return r.choices[0].message.content.strip()
    except Exception:
        pass
    return None


def _complete_gemini(system: str, user: str, model: str | None = None) -> str | None:
    """Gemini completion with Opik tracing via track_genai."""
    if not settings.google_api_key:
        return None
    model = model or settings.gemini_model
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=settings.google_api_key)
        if settings.opik_api_key:
            _configure_opik_env()
            try:
                from opik.integrations.genai import track_genai
                client = track_genai(
                    client,
                    project_name=settings.opik_project_name or "goal-muse",
                )
            except Exception as e:
                logger.debug("Opik Gemini tracing disabled: %s", e)

        config = types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.2,
        )
        response = client.models.generate_content(
            model=model,
            contents=user,
            config=config,
        )
        if response and response.text:
            return response.text.strip()
    except Exception:
        pass
    return None


_PROVIDERS = {
    "openai": _complete_openai,
    "openrouter": _complete_openrouter,
    "gemini": _complete_gemini,
}


def complete(system: str, user: str) -> str | None:
    """One completion. Returns content or None if disabled/failed.
    Uses per-request override (set_llm_override) if set, else settings.llm_provider."""
    provider, model_override = _get_effective_provider_and_model()
    provider = (provider or "openai").lower().strip()
    fn = _PROVIDERS.get(provider, _complete_openai)
    return fn(system, user, model_override)


def complete_json(
    system: str,
    user: str,
    json_instruction: str = "Respond with only valid JSON, no markdown or extra text.",
) -> dict | None:
    """Completion that must be valid JSON. Returns parsed dict or None."""
    full_user = f"{user}\n\n{json_instruction}"
    raw = complete(system, full_user)
    if not raw:
        return None
    # Strip markdown code block if present
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
