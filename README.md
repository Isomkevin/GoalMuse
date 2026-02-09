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

## Submission

| | |
|--|--|
| **What is this?** | An app that turns your vision board and daily habits into one clear next step and a progress score you can trust. |
| **Code** | [GitHub repository](https://github.com/Isomkevin/GoalMuse) |
| **Demo video** | [Watch on YouTube](https://www.youtube.com/watch?v=YOUR_VIDEO_ID) |
| **Live demo** | [goal-muse.vercel.app](https://goal-muse.vercel.app/) |
| **Presentation** | [Pitch deck](https://pitch.com/v/ai-goalmuse-pitch-transform-vision-to-results-nqznsz) |

*(Replace `YOUR_VIDEO_ID` in the demo video link and in the embed below when your video is ready. Full copy-paste text for the submission form is in `SUBMISSION_CHECKPOINT_3.md`.)*

---

## Value in 60 seconds

- **Vision boards & goals** — Create a board, add goals (with optional target dates).
- **Tasks & journal** — Daily tasks and reflections; link tasks to goals.
- **Progress confidence** — Score 0–100 from task completion, consistency, alignment, and agent confidence; transparent breakdown.
- **Three AI agents** — Alignment (actions ↔ goals), Synergy (goal connections, compound actions), Optimization (one next action + reason). Explainable.
- **Feedback** — "Did this help?" (Yes / Somewhat / No) stored for evaluation.
- **Opik** — Traces and metrics for agent/LLM calls; experiments and regression tests.

## Architecture

- **Mobile:** Expo + React Native + TypeScript + Zustand. Tabs: Board, Goals, Tasks & Journal, Insights, Voice.
- **Backend:** FastAPI, JWT, CRUD (boards, goals, tasks, journal). Progress confidence + AI insights. Opik on agent/LLM.
- **AI:** Alignment, Synergy, Optimization agents; single LLM interface. Modular, explainable.

Full diagram and API list: `docs/PHASE_0_ARCHITECTURE_AND_CONSTRAINTS.md`.

## Run

**Backend:** `cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`

**Mobile app:** `cd mobile && npm install && npx expo start`

Mock login: **demo@goalmuse.app** / **demo123** if backend is not running.

## How we use Opik (evaluation & observability)

We use Opik so every improvement is measurable and visible to judges and developers.

- **Traces:** Each Insights request creates one trace with child spans for the alignment, synergy, and optimization agents and their LLM calls. Full hierarchy is visible in the Opik project.
- **Eval scores (LLM-as-judge):** When `OPIK_RUN_EVALS=true`, we run three small judges per request and log scores on the trace: **alignment_quality**, **next_action_usefulness**, **synergy_relevance** (1–5). These appear as feedback scores in Opik.
- **Human feedback on trace:** When a user taps "Did this help?" (Yes / Somewhat / No), we store the rating in the app and **log it to the corresponding Opik trace** via `log_traces_feedback_scores`, so you see trace + model/prompt + human rating in one place.
- **Experiments (fixed dataset):** We run a small fixed dataset through the pipeline with different providers (e.g. OpenAI vs Gemini) and compare results in Opik. See `backend/scripts/experiments/` and run:  
  `cd backend && OPIK_API_KEY=xxx LLM_PROVIDER=openai python -m scripts.experiments.run_experiment --label openai`  
  then with another provider to compare traces and metrics. To build the full comparison used in **Settings → Advanced Features** (so users can choose an LLM with an informed recommendation), run:  
  `cd backend && python -m scripts.experiments.run_all_experiments`.
- **Advanced Features (LLM choice):** In **Profile → Advanced Features**, users can switch which LLM powers insights (OpenAI, OpenRouter, Gemini) and see Opik experiment comparison and recommendation. Opik is the measuring tape for that decision.
- **Dashboard (Judge / Dev view):** In the app, open **AI Insights** and tap the **three dots (⋮)** in the header to open the Opik dashboard in a WebView. It shows recent traces, eval and feedback summary, and a short "What we measure" section. You can also open `{API_BASE}/dashboard?token=YOUR_JWT` in a browser.

Screenshots or a short video of your Opik project (traces, eval results, experiments) are recommended for submission so judges can see that Opik is in the workflow and used for metrics and decisions.

## Demo & judging

- **5-min demo script:** `docs/DEMO_SCRIPT.md`
- **Value per criteria:** `docs/JUDGE_VALUE_PROPOSITION.md`
