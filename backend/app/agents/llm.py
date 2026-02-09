"""
Single LLM interface. Low temperature for consistent, explainable outputs.
Supports OpenAI, OpenRouter, and Gemini via config.llm_provider.
Opik: when OPIK_API_KEY is set, traced calls are sent to Opik.
"""
import json
import logging
import os
import re

from app.config import settings

logger = logging.getLogger(__name__)

# Opik: set env so track_openai / track_genai use our project when configured
def _configure_opik_env():
    if settings.opik_api_key:
        os.environ.setdefault("OPIK_API_KEY", settings.opik_api_key)
    if settings.opik_workspace:
        os.environ.setdefault("OPIK_WORKSPACE", settings.opik_workspace)
    if settings.opik_project_name:
        os.environ.setdefault("OPIK_PROJECT_NAME", settings.opik_project_name)


def _complete_openai(system: str, user: str) -> str | None:
    """OpenAI completion with Opik tracing."""
    if not settings.openai_api_key:
        return None
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
            model=settings.openai_model,
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


def _complete_openrouter(system: str, user: str) -> str | None:
    """OpenRouter completion (OpenAI-compatible API) with Opik tracing."""
    if not settings.openrouter_api_key:
        return None
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
            model=settings.openrouter_model,
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


def _complete_gemini(system: str, user: str) -> str | None:
    """Gemini completion with Opik tracing via track_genai."""
    if not settings.google_api_key:
        return None
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
            model=settings.gemini_model,
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
    Routes to the provider specified by settings.llm_provider."""
    provider = (settings.llm_provider or "openai").lower().strip()
    fn = _PROVIDERS.get(provider, _complete_openai)
    return fn(system, user)


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
