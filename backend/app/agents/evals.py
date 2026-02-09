"""
Opik LLM-as-judge evals for insights: alignment quality, next-action usefulness, synergy relevance.
Scores are logged to the Opik trace so each insight request has eval metrics in the same project.
"""
import logging
import re

from app.config import settings
from app.agents.llm import complete

logger = logging.getLogger(__name__)


def _parse_score(raw: str | None) -> float | None:
    """Extract a 1-5 score from judge output."""
    if not raw:
        return None
    # Try integer or float in the text
    m = re.search(r"\b([1-5])(?:\.\d+)?\b", raw.strip())
    if m:
        return float(m.group(1))
    return None


def score_alignment_quality(goals_summary: str, alignment_score: int, explanation: str) -> float | None:
    """LLM-as-judge: rate 1-5 how clear and accurate the alignment explanation is."""
    if not goals_summary or not explanation:
        return None
    system = """You are an evaluator. Rate from 1 to 5 how clear and accurate the alignment explanation is given the user's goals. Reply with only a single number 1-5, nothing else."""
    user = f"Goals:\n{goals_summary[:800]}\n\nAlignment score (0-100): {alignment_score}\nExplanation: {explanation}\n\nYour rating (1-5):"
    raw = complete(system, user)
    return _parse_score(raw)


def score_next_action_usefulness(goals_summary: str, action: str, reason: str) -> float | None:
    """LLM-as-judge: rate 1-5 how actionable and relevant the suggested next action is."""
    if not goals_summary or not action:
        return None
    system = """You are an evaluator. Rate from 1 to 5 how actionable and relevant the suggested next action is for the user's goals. Reply with only a single number 1-5, nothing else."""
    user = f"Goals:\n{goals_summary[:800]}\n\nSuggested action: {action}\nReason: {reason or 'N/A'}\n\nYour rating (1-5):"
    raw = complete(system, user)
    return _parse_score(raw)


def score_synergy_relevance(goals_summary: str, explanation: str, compound_actions: list[str]) -> float | None:
    """LLM-as-judge: rate 1-5 how relevant the synergies and compound actions are."""
    if not goals_summary:
        return None
    system = """You are an evaluator. Rate from 1 to 5 how relevant the goal synergies and compound actions are for the user's goals. Reply with only a single number 1-5, nothing else."""
    actions_text = "\n".join(compound_actions[:5]) if compound_actions else "None"
    user = f"Goals:\n{goals_summary[:800]}\n\nSynergy explanation: {explanation or 'N/A'}\nCompound actions:\n{actions_text}\n\nYour rating (1-5):"
    raw = complete(system, user)
    return _parse_score(raw)


def run_insight_evals_and_log(
    trace_id: str,
    goals_summary: str,
    alignment: dict,
    synergy: dict,
    optimization: dict,
) -> None:
    """
    Run LLM-as-judge evals for this insight run and log scores to the Opik trace.
    No-op if Opik is not configured or trace_id is empty.
    """
    if not trace_id or not settings.opik_api_key or not settings.opik_run_evals:
        return
    scores_to_log = []
    try:
        v = score_alignment_quality(
            goals_summary,
            alignment.get("score", 0),
            alignment.get("explanation", ""),
        )
        if v is not None:
            scores_to_log.append({"name": "alignment_quality", "value": v, "reason": "LLM-as-judge"})
    except Exception as e:
        logger.debug("Eval alignment_quality failed: %s", e)
    try:
        v = score_next_action_usefulness(
            goals_summary,
            optimization.get("action", ""),
            optimization.get("reason", ""),
        )
        if v is not None:
            scores_to_log.append({"name": "next_action_usefulness", "value": v, "reason": "LLM-as-judge"})
    except Exception as e:
        logger.debug("Eval next_action_usefulness failed: %s", e)
    try:
        v = score_synergy_relevance(
            goals_summary,
            synergy.get("explanation", ""),
            synergy.get("compound_actions", []) or [],
        )
        if v is not None:
            scores_to_log.append({"name": "synergy_relevance", "value": v, "reason": "LLM-as-judge"})
    except Exception as e:
        logger.debug("Eval synergy_relevance failed: %s", e)
    if not scores_to_log:
        return
    try:
        import opik
        project = settings.opik_project_name or "goal-muse"
        opik.Opik().log_traces_feedback_scores(
            scores=[
                {"id": trace_id, "name": s["name"], "value": s["value"], "reason": s.get("reason", ""), "project_name": project}
                for s in scores_to_log
            ]
        )
    except Exception as e:
        logger.warning("Opik log_traces_feedback_scores failed: %s", e)
