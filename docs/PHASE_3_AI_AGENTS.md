# Phase 3 — AI Agents (Core Intelligence)

## Delivered

### Three agents (modular, explainable)

| Agent | Responsibility | Inputs | Output |
|-------|----------------|--------|--------|
| **Alignment** | Scores daily actions vs goals | Goals, tasks, journal snippets | `score` (0–100) + `explanation` (one sentence) |
| **Synergy** | Finds goal relationships, compound actions | Board goals | `pairs` (goal_ids + reason), `compound_actions` (1–3), `explanation` |
| **Optimization** | Picks ONE next action | Goals, incomplete tasks, completed count | `action`, `reason`, `goal_id` |

- **Modular:** Each agent in its own module (`app/agents/alignment.py`, `synergy.py`, `optimization.py`); single LLM interface in `llm.py`.
- **Explainable:** Every response includes a short reason/explanation; optimization returns one action + why.
- **Deterministic:** Low temperature (0.2); JSON output with fixed keys; fallbacks when API key missing or LLM fails.

### Backend

- **Config:** `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`) in settings; agents no-op with fallback messages if key not set.
- **Route:** `GET /api/v1/ai/insights?board_id=...` — runs all three agents with the user’s board, goals, tasks, journal; returns `InsightsResponse` (alignment, synergy, optimization).
- **Schemas:** `AlignmentResponse`, `SynergyResponse` (GoalPair, compound_actions), `OptimizationResponse`, `InsightsResponse`.

### Frontend

- **Insights tab:** Fetches `/ai/insights` when the board and token are available; pull-to-refresh.
- **UI:** Alignment (score + explanation), Goal synergy (explanation, pairs, compound actions), Next action (one highlighted action + reason).
- **States:** Loading, error with retry, empty board.

### Exit criteria

- **AI outputs feel intentional:** Single next action; alignment score + one explanation; synergy pairs + compound actions.
- **Suggestions are decisive:** Optimization returns one action, not a list.
- **Users see why:** Every block shows explanation/reason text.

## Run

1. Set `OPENAI_API_KEY` in backend `.env` (or leave unset for fallback messages).
2. Backend + frontend as in Phase 2; open Insights tab to load AI insights.
