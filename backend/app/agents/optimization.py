"""
Optimization Agent: selects ONE highest-impact next action.
Outputs: single recommended action + reason. Decisive, not a list.
"""

from app.agents.llm import complete_json
from app.agents._opik import track_agent


@track_agent(name="optimization")
def run_optimization(
    goals: list[dict],
    tasks: list[dict],
    completed_count: int,
) -> dict:
    """
    goals: [{"id", "title", "description"}]
    tasks: [{"id", "title", "goal_id", "completed_at"}]
    completed_count: number of completed tasks (for context)
    Returns: {"action": str, "reason": str, "goal_id": str | null}
    """
    if not goals:
        return {
            "action": "Add a goal to get a recommendation.",
            "reason": "No goals yet.",
            "goal_id": None,
        }

    goals_text = "\n".join(f"- id={g['id']}: {g['title']}" for g in goals)
    incomplete = [t for t in tasks if not t.get("completed_at")][:15]
    tasks_text = "\n".join(
        f"- {t['title']}" + (f" (goal_id={t.get('goal_id')})" if t.get("goal_id") else "")
        for t in incomplete
    ) if incomplete else "(no incomplete tasks)"

    system = """You recommend exactly ONE next action that will have the highest impact on the user's goals.
Output exactly this JSON: {"action": "<single concrete action, short>", "reason": "<one sentence why this one>", "goal_id": "<id or null>"}
- action: One specific task or step. Not a list. 10–15 words max.
- reason: One sentence. Why this action now.
- goal_id: The goal this action best serves, or null if generic."""

    user = f"""Goals:\n{goals_text}\n\nIncomplete tasks:\n{tasks_text}\n\nCompleted so far: {completed_count}."""

    out = complete_json(system, user)
    if not out or "action" not in out:
        return {
            "action": "Pick one incomplete task and do it next.",
            "reason": "Unable to rank; choose the most urgent.",
            "goal_id": None,
        }

    action = str(out.get("action", ""))[:150].strip() or "Choose your next task."
    reason = str(out.get("reason", ""))[:200].strip() or "No reason given."
    goal_id = out.get("goal_id") if out.get("goal_id") else None
    return {"action": action, "reason": reason, "goal_id": goal_id}
