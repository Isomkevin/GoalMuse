"""
Opik dashboard API: return recent traces and summary for the Judge/Dev view.
API key stays on backend; dashboard frontend calls this.
"""
import logging
from typing import Any

from fastapi import APIRouter, Depends

from app.config import settings
from app.api.deps import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/opik-dashboard", tags=["opik-dashboard"])


def _fetch_traces_summary() -> list[dict[str, Any]]:
    """Fetch recent traces from Opik (when configured)."""
    if not settings.opik_api_key:
        return []
    try:
        import opik
        client = opik.Opik()
        project = settings.opik_project_name or "goal-muse"
        traces = client.search_traces(project_name=project, max_results=50)
        out = []
        for t in traces:
            out.append({
                "id": getattr(t, "id", str(t)),
                "name": getattr(t, "name", "insights"),
                "start_time": getattr(t, "start_time", None),
                "feedback_scores": getattr(t, "feedback_scores", None) or [],
            })
        return out
    except Exception as e:
        logger.warning("Opik search_traces failed: %s", e)
        return []


@router.get("/data")
def get_dashboard_data(user_id: str = Depends(get_current_user_id)):
    """
    Return data for the Opik dashboard: recent traces and eval/feedback summary.
    Requires auth so only logged-in app users (or judges with a token) can view.
    """
    traces = _fetch_traces_summary()
    # Build a small summary for Judge/Dev view
    scores_by_name: dict[str, list[float]] = {}
    for t in traces:
        for s in t.get("feedback_scores") or []:
            name = s.get("name") if isinstance(s, dict) else getattr(s, "name", "score")
            val = s.get("value") if isinstance(s, dict) else getattr(s, "value", None)
            if name and val is not None:
                scores_by_name.setdefault(name, []).append(float(val))
    summary = {
        name: {"count": len(vals), "avg": round(sum(vals) / len(vals), 2) if vals else 0}
        for name, vals in scores_by_name.items()
    }
    return {
        "traces": traces,
        "summary": summary,
        "project_name": settings.opik_project_name or "goal-muse",
        "opik_configured": bool(settings.opik_api_key),
    }
