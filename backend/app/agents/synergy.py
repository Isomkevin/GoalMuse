"""
Synergy Agent: finds relationships between goals and suggests compound actions.
Outputs: goal pairs/groups + short explanation + 1–3 compound action suggestions.
Does not score alignment or progress.
"""

from app.agents.llm import complete_json
from app.agents._opik import track_agent


@track_agent(name="synergy")
def run_synergy(goals: list[dict]) -> dict:
    """
    goals: [{"id", "title", "description"}]
    Returns: {"pairs": [{"goal_ids": [id, id], "reason": str}], "compound_actions": [str], "explanation": str}
    """
    if len(goals) < 2:
        return {
            "pairs": [],
            "compound_actions": [],
            "explanation": "Add at least two goals to find synergies.",
        }

    goals_text = "\n".join(f"- id={g['id']}: {g['title']} — {g.get('description', '')}" for g in goals)

    system = """You find connections between goals and suggest actions that advance multiple goals at once.
Output exactly this JSON:
{
  "pairs": [{"goal_ids": ["<id1>", "<id2>"], "reason": "<one sentence why they connect>"}],
  "compound_actions": ["<action 1>", "<action 2>"],
  "explanation": "<one sentence overall>"
}
- pairs: up to 3 most relevant pairs. Use the exact goal ids from the input.
- compound_actions: 1–3 concrete actions that help more than one goal. Short phrases.
- explanation: One sentence. No fluff."""

    user = f"Goals:\n{goals_text}"

    out = complete_json(system, user)
    if not out:
        return {"pairs": [], "compound_actions": [], "explanation": "Unable to compute synergies."}

    pairs = out.get("pairs") or []
    if not isinstance(pairs, list):
        pairs = []
    compound = out.get("compound_actions") or []
    if not isinstance(compound, list):
        compound = []
    compound = [str(c)[:120] for c in compound[:3]]
    explanation = str(out.get("explanation", ""))[:200].strip() or "No explanation."
    return {
        "pairs": pairs[:5],
        "compound_actions": compound,
        "explanation": explanation,
    }
