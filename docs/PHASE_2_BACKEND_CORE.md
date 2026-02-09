# Phase 2 — Backend Core (Complete)

## Delivered

### Backend (FastAPI)

- **Auth:** JWT (register, login, `/auth/me`). Token stored in frontend AsyncStorage; sent as `Authorization: Bearer <token>`.
- **DB:** SQLAlchemy, SQLite by default; `DATABASE_URL` for Postgres. Schema: User, VisionBoard, Goal, Task, JournalEntry, journal_entry_goals (M2M).
- **Routes:** Boards (CRUD + get with goals), Goals (create under board, update, delete), Entries (tasks + journal CRUD), Progress (board progress by goal).
- **Validation:** Pydantic request/response schemas; 400/401/404 with `detail`.
- **CORS:** Allow all origins for dev.

### Frontend wiring

- **API client** (`frontend/lib/api.ts`): `authApi`, `boardsApi`, `goalsApi`, `tasksApi`, `journalApi`, `progressApi`; token passed per request.
- **Token storage:** `@react-native-async-storage/async-storage`; get/set/clear on login/logout and hydrate on app load.
- **Store:** Zustand store calls API for all mutations and key reads; no mock data. `hydrateAuth()` restores session from stored token; `loadBoards()` loads boards + first board goals + tasks + journal.
- **Screens:** Login/register call API and then `loadBoards()` before navigating to tabs. Index runs `hydrateAuth()` then redirects; if user exists, runs `loadBoards()` then replaces to tabs.

### Exit criteria

- **Frontend ↔ backend wired:** All auth and CRUD go through `/api/v1` with Bearer token.
- **Data persists:** SQLite file; new sessions see same data after login.
- **No fake state:** Store only holds server data and token; no in-memory mock seed.

## How to run full stack

1. **Backend:** `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --host 0.0.0.0`
2. **Frontend:** `cd frontend && npm install && npx expo start`
3. On a **physical device**, set API base in `frontend/lib/api.ts` to your machine’s IP (e.g. `http://192.168.1.x:8000/api/v1`) or use a tunnel.
