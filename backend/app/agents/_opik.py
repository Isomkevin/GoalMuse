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
