# Phase 4 — Progress Model & Feedback Loop

## Delivered

### Progress confidence (not raw completion)

- **Model** (`app/services/progress_confidence.py`): Combines four signals (each 0–100), weighted:
  - **Task completion** (30%): % of tasks completed.
  - **Consistency** (25%): % of last 7 days with at least one completed task or journal entry.
  - **Alignment** (30%): Score from Alignment agent (how well actions match goals).
  - **Agent confidence** (15%): Whether we have goals and tasks so recommendations are meaningful.
- **Output:** Single `confidence_score` (0–100) plus **breakdown** (all four components) and a short **explanation** so users see how progress is calculated.
- **Endpoint:** `GET /api/v1/progress/confidence?board_id=...` — loads board/tasks/journal, runs alignment agent, computes consistency, returns `ProgressConfidenceResponse`.

### Transparent display

- **Frontend (Insights):** “Progress confidence” card shows score, subtitle “Not just task count—momentum & alignment”, the explanation, and a “How it’s calculated” section listing the four components. Raw “Task completion” remains in a separate card so it’s clear that confidence is different.

### User feedback

- **Model:** `InsightFeedback` (user_id, rating: yes/no/somewhat, created_at).
- **Endpoint:** `POST /api/v1/ai/feedback` with body `{ "rating": "yes" | "no" | "somewhat" }`. Stored for evaluation.
- **Frontend:** After AI insights (alignment, synergy, next action), “Did this help?” with three buttons (Yes, Somewhat, No). On submit, feedback is sent and replaced by “Thanks for your feedback.”

### Exit criteria

- **No misleading metrics:** Confidence is explicitly described and broken down; raw task % is separate.
- **Progress feels earned:** Confidence reflects consistency and alignment, not only completion count.
- **Feedback captured reliably:** One rating per session, persisted in DB.

## Run

Backend creates `insight_feedback` table on startup. Use Insights tab to see confidence and submit feedback.
