"""
Settings API: LLM preference (Advanced Features) and Opik experiment summary.
"""
import json
import logging
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas.settings import LLMPreferenceUpdate

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/settings", tags=["settings"])

# Path written by run_experiment.py for the app to read
EXPERIMENT_RESULTS_DIR = Path(__file__).resolve().parent.parent.parent / "experiment_results"
LATEST_EXPERIMENT_JSON = EXPERIMENT_RESULTS_DIR / "latest.json"


def _available_providers():
    """Which providers have API keys and their default models."""
    out = []
    if settings.openai_api_key:
        out.append({"id": "openai", "name": "OpenAI", "model_default": settings.openai_model, "available": True})
    if settings.openrouter_api_key:
        out.append({"id": "openrouter", "name": "OpenRouter", "model_default": settings.openrouter_model, "available": True})
    if settings.google_api_key:
        out.append({"id": "gemini", "name": "Google Gemini", "model_default": settings.gemini_model, "available": True})
    if not out:
        out = [
            {"id": "openai", "name": "OpenAI", "model_default": settings.openai_model, "available": False},
            {"id": "openrouter", "name": "OpenRouter", "model_default": settings.openrouter_model, "available": False},
            {"id": "gemini", "name": "Google Gemini", "model_default": settings.gemini_model, "available": False},
        ]
    return out


@router.get("/llm")
def get_llm_settings(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Return available LLM providers and the current user's preference (for Advanced Features)."""
    user = db.query(User).filter(User.id == user_id).first()
    current = {"provider": settings.llm_provider or "openai", "model": None}
    if user and user.llm_preferences:
        try:
            prefs = json.loads(user.llm_preferences) if isinstance(user.llm_preferences, str) else user.llm_preferences
            if isinstance(prefs, dict):
                current["provider"] = prefs.get("provider") or current["provider"]
                current["model"] = prefs.get("model") or prefs.get(f"{current['provider']}_model")
        except Exception:
            pass
    return {
        "available_providers": _available_providers(),
        "current": current,
    }


@router.patch("/llm")
def update_llm_settings(
    body: LLMPreferenceUpdate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """Update the current user's LLM preference (provider and optional model). Used by Advanced Features."""
    provider = (body.provider or "").lower().strip()
    if provider not in ("openai", "openrouter", "gemini"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="provider must be openai, openrouter, or gemini")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    prefs = {}
    if user.llm_preferences:
        try:
            prefs = json.loads(user.llm_preferences) if isinstance(user.llm_preferences, str) else dict(user.llm_preferences)
        except Exception:
            pass
    prefs["provider"] = provider
    if body.model is not None:
        prefs["model"] = body.model.strip() or None
    user.llm_preferences = json.dumps(prefs)
    db.add(user)
    db.commit()
    return {"ok": True, "current": {"provider": provider, "model": prefs.get("model")}}


@router.get("/llm-experiments")
def get_llm_experiments(user_id: str = Depends(get_current_user_id)):
    """Return the latest Opik experiment comparison (written by run_experiment.py). Used as the 'measuring tape' in Advanced Features."""
    if not LATEST_EXPERIMENT_JSON.exists():
        return {"runs": [], "recommendation": None, "message": "No experiment results yet. Run: python -m scripts.experiments.run_experiment --label <provider>"}
    try:
        data = json.loads(LATEST_EXPERIMENT_JSON.read_text())
        return {
            "runs": data.get("runs", []),
            "recommendation": data.get("recommendation"),
            "updated_at": data.get("updated_at"),
        }
    except Exception as e:
        logger.warning("Failed to read experiment results: %s", e)
        return {"runs": [], "recommendation": None, "message": "Could not load experiment results."}
