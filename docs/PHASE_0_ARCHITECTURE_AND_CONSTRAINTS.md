# Phase 0 — Grounding & Constraints

**AI Vision Board & Goal Companion**  
Production-quality mobile app with AI agents and Opik observability.  
*No implementation code — architecture, models, contracts, and boundaries only.*

---

## 1. System Architecture (Textual Diagram)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Frontend)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Vision Board │  │ Tasks &      │  │ Progress     │  │ Insight Dashboard    │  │
│  │ (drag-drop)  │  │ Journal UI   │  │ Tracker      │  │ (suggestions, links) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                 │                      │              │
│         └─────────────────┴─────────────────┴──────────────────────┘              │
│                                    │ HTTPS / REST                                   │
└────────────────────────────────────┼───────────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND (API Layer)                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │  FastAPI App                                                                  │ │
│  │  • Auth (register, login, JWT)                                                │ │
│  │  • Boards, Goals, Entries (CRUD)                                              │ │
│  │  • Progress service (aggregation)                                             │ │
│  │  • Agent orchestration (delegate to AI layer)                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                              │
└────────────────────────────────────┼──────────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AI LAYER (Agents)                                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                    │
│  │ Alignment       │  │ Optimization    │  │ Synergy         │                    │
│  │ Agent           │  │ Agent           │  │ Agent           │                    │
│  │ (task→goal fit) │  │ (prioritize,    │  │ (goal linking,  │                    │
│  │                 │  │  suggestions)   │  │  cross-goal     │                    │
│  │                 │  │                 │  │  actions)       │                    │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘                    │
│           │                     │                    │                             │
│           └─────────────────────┴────────────────────┘                             │
│                                     │ LLM (e.g. OpenAI GPT)                        │
└─────────────────────────────────────┼─────────────────────────────────────────────┘
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OBSERVABILITY (Opik)                                 │
│  • Traces: request → agent calls → LLM calls                                      │
│  • Metrics: latency, token usage, error rates per agent/route                     │
│  • Logs: structured (user_id, board_id, agent_id)                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                           │
│  • Relational DB (SQLite for MVP / Postgres for production):                      │
│    Users, VisionBoards, Goals, Tasks, JournalEntries,                             │
│    AIRecommendations, Feedback                                                    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Data flow (summary):**
- **Frontend** → REST API → **Backend** (auth, CRUD, progress).
- **Backend** → **AI layer** (alignment, optimization, synergy agents) → **LLM**.
- **Backend** stores and returns **AIRecommendation** and progress; **Opik** observes all AI/API calls.

---

## 2. Core Data Model Definitions

| Entity | Purpose | Key Fields (conceptual) |
|--------|---------|--------------------------|
| **User** | Identity and auth | `id`, `email`, `password_hash`, `created_at` |
| **VisionBoard** | One board per user (or multiple) | `id`, `user_id`, `title`, `created_at`, `updated_at` |
| **Goal** | Single goal on a board (with optional image/icon) | `id`, `board_id`, `title`, `description`, `target_date`, `milestone_definition` (e.g. text or structured), `sort_order` |
| **Task** | Single actionable item, optionally linked to a goal | `id`, `user_id`, `goal_id` (nullable), `title`, `due_date`, `completed_at`, `created_at` |
| **JournalEntry** | Daily log linked to goals/tasks | `id`, `user_id`, `content`, `goal_ids[]` or single `goal_id`, `created_at` |
| **AIRecommendation** | Stored suggestion from any agent | `id`, `user_id`, `goal_id` (nullable), `agent_type` (alignment|optimization|synergy), `content`, `payload` (e.g. suggested_task, links), `created_at` |
| **Feedback** | User feedback on a recommendation (for learning / analytics) | `id`, `recommendation_id`, `user_id`, `rating` or `accepted` (bool), `created_at` |

**Relationships:**
- User 1 → N VisionBoards.
- VisionBoard 1 → N Goals.
- User 1 → N Tasks; Task N → 1 Goal (optional).
- User 1 → N JournalEntries; JournalEntry can reference one or many Goals.
- User 1 → N AIRecommendations; AIRecommendation N → 1 Goal (optional).
- AIRecommendation 1 → N Feedback.

**MVP storage note:** SQLite for hackathon; schema should allow swapping to Postgres (e.g. same SQLAlchemy models).

---

## 3. API Route List (Contracts)

All routes are under a common API prefix (e.g. `/api/v1`). Auth: Bearer JWT unless stated.

| Method | Route | Description | Request shape (key) | Response shape (key) |
|--------|--------|-------------|----------------------|----------------------|
| **Auth** |
| POST | `/auth/register` | Register | `email`, `password` | `user`, `access_token`, `token_type` |
| POST | `/auth/login` | Login | `email`, `password` | `access_token`, `token_type` |
| **Boards** |
| GET | `/boards` | List user's boards | — | `boards[]` (id, title, created_at, goal_count) |
| POST | `/boards` | Create board | `title` | `board` |
| GET | `/boards/{id}` | Get board + goals | — | `board`, `goals[]` |
| PATCH | `/boards/{id}` | Update board | `title?` | `board` |
| DELETE | `/boards/{id}` | Delete board | — | 204 |
| **Goals** |
| POST | `/boards/{board_id}/goals` | Create goal | `title`, `description?`, `target_date?`, `milestone_definition?` | `goal` |
| PATCH | `/goals/{id}` | Update goal | `title?`, `description?`, `target_date?`, `milestone_definition?` | `goal` |
| DELETE | `/goals/{id}` | Delete goal | — | 204 |
| **Entries (Tasks + Journal)** |
| GET | `/entries/tasks` | List tasks (optional filter by goal) | `goal_id?`, `completed?` | `tasks[]` |
| POST | `/entries/tasks` | Create task | `goal_id?`, `title`, `due_date?` | `task` |
| PATCH | `/entries/tasks/{id}` | Update task (e.g. complete) | `completed?`, `title?`, `due_date?` | `task` |
| DELETE | `/entries/tasks/{id}` | Delete task | — | 204 |
| GET | `/entries/journal` | List journal entries (paginated) | `limit?`, `offset?`, `goal_id?` | `entries[]`, `total` |
| POST | `/entries/journal` | Create journal entry | `content`, `goal_ids[]?` | `entry` |
| **Progress** |
| GET | `/progress/board/{board_id}` | Progress per goal on board | — | `goals[]` with `percent_complete`, `milestone_status` |
| GET | `/progress/goal/{goal_id}` | Progress for one goal | — | `percent_complete`, `milestone_status`, `recent_tasks` |
| **AI (Agent endpoints)** |
| POST | `/ai/suggestions` | Get suggestions (optimization + alignment) | `board_id?`, `goal_id?`, `context?` | `recommendations[]` (agent_type, content, payload) |
| POST | `/ai/synergy` | Get goal links and synergistic actions | `board_id` or `goal_ids[]` | `links[]`, `synergistic_actions[]` |
| POST | `/ai/feedback` | Submit feedback on recommendation | `recommendation_id`, `accepted` (bool) or `rating` | 204 |
| **Optional for MVP** |
| GET | `/ai/recommendations` | List recent stored recommendations | `limit?` | `recommendations[]` |

**Request/response shapes:** Use consistent JSON; dates in ISO8601; pagination via `limit`/`offset` or `cursor`. Error responses: `{ "detail": string }` or structured validation errors.

---

## 4. Agent Responsibility Table

| Agent | Responsibility | Inputs | Outputs | Out of scope |
|-------|----------------|--------|---------|--------------|
| **Alignment** | Evaluate how well tasks/journal entries align with goals; suggest adjustments. | User's tasks, journal snippets, goal definitions | Alignment score or short feedback; suggested task edits or prompts | Does not create new goals or delete data. Does not run optimization or synergy. |
| **Optimization** | Prioritize actions; suggest next best tasks; estimate % progress toward milestones. | Goals, current tasks, completion state, optional journal | Ordered list of suggested tasks; progress estimate; “what to do next” | Does not link goals. Does not write to DB (backend persists). |
| **Synergy** | Find connections between goals; suggest cross-goal actions (e.g. “travel + speaking”). | Board goals (titles/descriptions) | Pairs/groups of related goals; short explanation; synergistic action suggestions | Does not evaluate single-task alignment or compute progress %. |

**No overlap:**  
- **Alignment** = “Does this task fit this goal?”  
- **Optimization** = “What should I do next and how far am I?”  
- **Synergy** = “Which goals connect and what combined actions help?”

Orchestration lives in the **backend**: one endpoint can call Optimization + Alignment; a separate endpoint calls Synergy. Agents do not call each other directly.

---

## 5. Explicitly Out of Scope for the Hackathon

- **Full AI planning / autonomous planning loops** — MVP is “suggestions on demand,” not continuous replanning.
- **Calendar integration** — No reading/writing external calendars.
- **Payment / subscriptions** — No billing.
- **Rich media storage** — Images on vision board: URLs or placeholders only (no upload pipeline required for MVP).
- **Multi-tenant / teams** — Single user per account; no sharing boards with other users.
- **Real-time push** — No WebSockets; polling or request-on-action is enough.
- **Production-grade auth** — Email/password + JWT is enough; no OAuth, no email verification required for MVP.
- **Full Opik integration** — Instrument key agent/LLM calls; full dashboard and alerts optional.

---

## 6. Exit Criteria Checklist

| Criterion | Status |
|-----------|--------|
| System explainable in ~2 minutes | ✅ Architecture + data flow above |
| No overlapping agent responsibilities | ✅ Alignment vs Optimization vs Synergy table |
| Clear MVP boundaries | ✅ In-scope: boards, goals, tasks, journal, progress, 3 agents, suggestions, synergy. Out-of-scope listed in §5 |

---

**Next phase:** Phase 1 — implement backend (data models, DB, API routes, no AI yet) or frontend shell; complete one phase fully before the next.
