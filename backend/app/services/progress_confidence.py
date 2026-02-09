"""
Progress Confidence: NOT raw completion.
Combines task completion, consistency, alignment score, and agent confidence.
Transparent breakdown so users see how progress is calculated.
"""
from datetime import datetime, timezone, timedelta


# Weights (sum = 1.0). All components 0–100.
WEIGHT_TASK = 0.30
WEIGHT_CONSISTENCY = 0.25
WEIGHT_ALIGNMENT = 0.30
WEIGHT_AGENT = 0.15


def _to_naive_utc(d: datetime) -> datetime:
    """Normalize to naive UTC for comparison (avoids offset-naive vs offset-aware)."""
    if d.tzinfo is None:
        return d
    return d.astimezone(timezone.utc).replace(tzinfo=None)


def _days_with_activity(task_dates: list[datetime], journal_dates: list[datetime], last_n_days: int = 7) -> float:
    """Fraction of last N days that had at least one task completed or journal entry (0–100)."""
    if last_n_days <= 0:
        return 0.0
    cutoff = (datetime.now(timezone.utc) - timedelta(days=last_n_days)).replace(tzinfo=None)
    task_days = set()
    for d in task_dates:
        nd = _to_naive_utc(d)
        if nd >= cutoff:
            task_days.add(nd.date())
    journal_days = set()
    for d in journal_dates:
        nd = _to_naive_utc(d)
        if nd >= cutoff:
            journal_days.add(nd.date())
    active_days = len(task_days | journal_days)
    return min(100.0, (active_days / last_n_days) * 100.0)


def compute_confidence(
    tasks_total: int,
    tasks_completed: int,
    task_completed_dates: list[datetime],
    journal_dates: list[datetime],
    alignment_score: float,
    has_goals: bool,
    has_incomplete_tasks: bool,
) -> dict:
    """
    Returns dict with:
    - confidence_score (0–100)
    - breakdown: task_completion, consistency, alignment, agent_confidence (each 0–100)
    - explanation (short)
    """
    # Task completion: % completed, capped as one signal
    task_pct = (tasks_completed / tasks_total * 100.0) if tasks_total else 0.0
    task_pct = min(100.0, task_pct)

    # Consistency: recent days with activity
    consistency_pct = _days_with_activity(task_completed_dates, journal_dates)

    # Alignment: from AI (already 0–100)
    alignment_pct = max(0.0, min(100.0, float(alignment_score)))

    # Agent confidence: we're confident when we have goals and can suggest (no randomness)
    agent_pct = 100.0 if (has_goals and (tasks_total > 0 or has_incomplete_tasks)) else 50.0

    score = (
        WEIGHT_TASK * task_pct
        + WEIGHT_CONSISTENCY * consistency_pct
        + WEIGHT_ALIGNMENT * alignment_pct
        + WEIGHT_AGENT * agent_pct
    )
    score = round(max(0.0, min(100.0, score)), 1)

    explanation = (
        "Progress confidence combines: how many tasks you complete, how consistently you show up, "
        "how well your actions align with your goals, and how clear your next step is. "
        "It's not a raw completion count—it reflects momentum and alignment."
    )
    return {
        "confidence_score": score,
        "breakdown": {
            "task_completion": round(task_pct, 1),
            "consistency": round(consistency_pct, 1),
            "alignment": round(alignment_pct, 1),
            "agent_confidence": round(agent_pct, 1),
        },
        "explanation": explanation,
    }
