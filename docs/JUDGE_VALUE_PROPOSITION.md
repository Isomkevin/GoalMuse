# GoalMuse — Value proposition for judges

Use this to align the demo and pitch with common judging criteria. Each section is a short, claimable value proposition.

---

## 1. Innovation / Technical ambition

- **Three cooperating AI agents** with clear boundaries: Alignment (actions ↔ goals), Synergy (goal connections, compound actions), Optimization (one next action). Not a single “AI suggestion” blob—modular, explainable, and extensible.
- **Progress confidence model** instead of raw “X% complete”: combines task completion, consistency, alignment, and agent confidence, with a **transparent breakdown** so users see how the number is calculated.
- **Opik integration** for observability: traces and metrics on agent/LLM calls, support for prompt experiments and regression tests so we can show **why version B beats version A** with data, not claims.

---

## 2. User value / Impact

- **One clear next action** — Optimization agent returns a single recommendation with a reason, reducing overload and decision fatigue.
- **Progress that feels earned** — Users see consistency and goal alignment, not just task count; “How it’s calculated” builds trust.
- **Feedback loop** — “Did this help?” (Yes / Somewhat / No) is stored and used for evaluation and future improvement.
- **Calm, focused UX** — Vision board → goals → tasks & journal → insights. No clutter; one-hand friendly; loading and error states everywhere.

---

## 3. Completeness / Execution

- **Full stack:** Mobile app (Expo/React Native), FastAPI backend, SQLite (Postgres-ready), JWT auth, CRUD for boards/goals/tasks/journal.
- **End-to-end flow:** Sign in → create board & goals → add tasks & journal → see progress and AI insights → give feedback → (optional) voice → account / sign out. No dead ends.
- **Error resilience:** Loading states, retry on failure, graceful fallback when backend or LLM is unavailable (e.g. mock auth, fallback messages).

---

## 4. AI / LLM use

- **Structured, explainable AI:** Each agent has defined inputs and outputs (scores, explanations, one action, compound actions). No randomness without reason; low temperature, JSON schemas.
- **Agents are callable via API:** Backend endpoints for insights and feedback; frontend consumes them. Clear separation between UI and AI logic.
- **Observability:** Opik traces and metrics so we can measure quality, compare prompt/model versions, and run regression tests on a fixed dataset.

---

## 5. Design / UX

- **Stitch-aligned UI** — Premium auth and consistent design system (theme tokens, spacing, typography). Feels production-grade, not hackathon-grade.
- **Clear states:** Loading (spinner + message), empty (illustration + CTA), error (message + retry). Judges can use the app without explanation.
- **Value in &lt;60 seconds:** Open app → sign in → see board and goals → open Insights → see one next action and progress confidence. The value proposition is visible immediately.

---

## 6. Differentiation

- **Not just a goal tracker:** Vision board + goals + tasks + journal + **AI that explains alignment, synergy, and one next step** + **progress confidence** + **feedback** + **Opik**.
- **Explainability first:** Every AI output has a reason or breakdown; progress is explained; no black box.
- **Built for evaluation:** Opik and feedback make it possible to improve and prove improvement over time.

---

## One-sentence pitch

**GoalMuse is an AI vision board and goal companion that gives users one clear next action and transparent progress—with three explainable agents and Opik so every improvement is measurable.**
