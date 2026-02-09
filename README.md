<div align="center">

![Goal Muse Logo](assets/goalmuse-logo.png)

# GoalMuse — AI Vision Board & Goal Companion

Mobile app: vision boards, goals, tasks, journal, and AI-powered insights with **Opik** observability.

</div>

---

## Video / Demo

<!-- Add your video: replace VIDEO_ID in both URLs below with your YouTube video ID (e.g. from https://www.youtube.com/watch?v=VIDEO_ID) -->
[![Goal Muse — Demo Video](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

*Click the thumbnail above to watch the demo on YouTube.*

---

## Value in 60 seconds

- **Vision boards & goals** — Create a board, add goals (with optional target dates).
- **Tasks & journal** — Daily tasks and reflections; link tasks to goals.
- **Progress confidence** — Score 0–100 from task completion, consistency, alignment, and agent confidence; transparent breakdown.
- **Three AI agents** — Alignment (actions ↔ goals), Synergy (goal connections, compound actions), Optimization (one next action + reason). Explainable.
- **Feedback** — "Did this help?" (Yes / Somewhat / No) stored for evaluation.
- **Opik** — Traces and metrics for agent/LLM calls; experiments and regression tests.

## Architecture

- **Frontend:** Expo + React Native + TypeScript + Zustand. Tabs: Board, Goals, Tasks & Journal, Insights, Voice.
- **Backend:** FastAPI, JWT, CRUD (boards, goals, tasks, journal). Progress confidence + AI insights. Opik on agent/LLM.
- **AI:** Alignment, Synergy, Optimization agents; single LLM interface. Modular, explainable.

Full diagram and API list: `docs/PHASE_0_ARCHITECTURE_AND_CONSTRAINTS.md`.

## Run

**Backend:** `cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`

**Frontend:** `cd frontend && npm install && npx expo start`

Mock login: **demo@goalmuse.app** / **demo123** if backend is not running.

## Demo & judging

- **5-min demo script:** `docs/DEMO_SCRIPT.md`
- **Value per criteria:** `docs/JUDGE_VALUE_PROPOSITION.md`
