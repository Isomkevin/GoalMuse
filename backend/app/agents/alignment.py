"""
Alignment Agent: scores how well recent daily actions align with active goals.
Outputs: alignment score (0-100) + one short explanation.
"""

from app.agents.llm import complete_json
from app.agents._opik import track_agent


@track_agent(name="alignment")
def run_alignment(
    goals: list[dict],
    tasks: list[dict],
    journal_snippets: list[str],
) -> dict:
    """
    goals: [{"id", "title", "description"}]
    tasks: [{"id", "title", "goal_id", "completed_at"}]
    journal_snippets: recent entry contents
    Returns: {"score": int 0-100, "explanation": str}
    """
    if not goals:
        return {"score": 0, "explanation": "No goals set. Add goals to measure alignment."}

    goals_text = "\n".join(f"- {g['title']}: {g.get('description', '')}" for g in goals)
    tasks_text = "\n".join(
        f"- {t['title']}" + (f" (goal_id={t.get('goal_id')})" if t.get("goal_id") else " (no goal)")
        for t in tasks[:20]
    )
    journal_text = "\n".join(f"- {s[:200]}" for s in journal_snippets[:5]) if journal_snippets else "(none)"

    system = """You are an alignment scorer. You evaluate how well a person's recent actions (tasks and journal) match their stated goals.
Output exactly this JSON: {"score": <0-100 integer>, "explanation": "<one short sentence>"}
- score: 0 = no alignment, 100 = actions clearly advance goals. Be strict.
- explanation: One sentence. No fluff."""

    user = f"""Goals:\n{goals_text}\n\nRecent tasks:\n{tasks_text}\n\nRecent journal:\n{journal_text}"""

    out = complete_json(system, user)
    if not out or "score" not in out:
        return {"score": 0, "explanation": "Unable to compute alignment."}

    score = max(0, min(100, int(out.get("score", 0))))
    explanation = str(out.get("explanation", ""))[:300].strip() or "No explanation available."
    return {"score": score, "explanation": explanation}
