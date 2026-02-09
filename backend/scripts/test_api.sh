#!/usr/bin/env bash
# GoalMuse API — smoke test all endpoints with curl.
# Uses demo@goalmuse.app / demo123. Requires: curl, Python (for JSON).
# Usage: ./scripts/test_api.sh [BASE_URL]
# Example: ./scripts/test_api.sh http://localhost:8000

set -e
BASE_URL="${1:-http://localhost:8000}"
DEMO_EMAIL="demo@goalmuse.app"
DEMO_PASSWORD="demo123"

# Use /tmp on Unix; Git Bash on Windows has /tmp. PowerShell: use $TEMP.
TMPDIR="${TMPDIR:-/tmp}"
[ -d "$TMPDIR" ] || TMPDIR="${TEMP:-.}"

if ! command -v python &>/dev/null && ! command -v python3 &>/dev/null; then
  echo "Error: Python is required (for JSON). Install Python or use WSL/Git Bash with Python."
  exit 1
fi

# Extract JSON key from file (no jq required; uses Python)
_json_py() { python -c "import sys,json; d=json.load(open(sys.argv[2])); v=d.get(sys.argv[1],'') or ''; print(v)" "$1" "$2" 2>/dev/null || python3 -c "import sys,json; d=json.load(open(sys.argv[2])); v=d.get(sys.argv[1],'') or ''; print(v)" "$1" "$2" 2>/dev/null; }
json_get() { _json_py "$1" "$2" || echo ""; }

# Pretty-print JSON if Python available, else cat
show_json() { [ -f "$1" ] && ( python -m json.tool "$1" 2>/dev/null || cat "$1" ); echo ""; }

echo "=== GoalMuse API smoke test ==="
echo "Base URL: $BASE_URL"
echo ""

# --- Health (no auth) ---
echo "[1] GET /health"
curl -s -o "$TMPDIR/r1.json" -w "  Status: %{http_code}\n" "$BASE_URL/health"
show_json "$TMPDIR/r1.json"

# --- Login ---
echo "[2] POST /api/v1/auth/login"
curl -s -o "$TMPDIR/r2.json" -w "  Status: %{http_code}\n" -X POST "$BASE_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASSWORD\"}"
TOKEN=$(json_get access_token "$TMPDIR/r2.json")
if [ -z "$TOKEN" ]; then
  echo "  Login failed. Response:"
  show_json "$TMPDIR/r2.json"
  exit 1
fi
echo "  Token: ${TOKEN:0:20}..."
echo ""

# --- Auth: me ---
echo "[3] GET /api/v1/auth/me"
curl -s -o "$TMPDIR/r3.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN"
show_json "$TMPDIR/r3.json"

# --- Boards: list ---
echo "[4] GET /api/v1/boards"
curl -s -o "$TMPDIR/r4.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/boards" \
  -H "Authorization: Bearer $TOKEN"
show_json "$TMPDIR/r4.json"

# --- Boards: create ---
echo "[5] POST /api/v1/boards"
curl -s -o "$TMPDIR/r5.json" -w "  Status: %{http_code}\n" -X POST "$BASE_URL/api/v1/boards" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test board from script"}'
BOARD_ID=$(json_get id "$TMPDIR/r5.json")
if [ -z "$BOARD_ID" ]; then
  echo "  Create board failed. Response:"
  show_json "$TMPDIR/r5.json"
  BOARD_ID=""
else
  echo "  Board ID: $BOARD_ID"
fi
show_json "$TMPDIR/r5.json"

# --- Boards: get one ---
if [ -n "$BOARD_ID" ]; then
  echo "[6] GET /api/v1/boards/$BOARD_ID"
  curl -s -o "$TMPDIR/r6.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/boards/$BOARD_ID" \
    -H "Authorization: Bearer $TOKEN"
  show_json "$TMPDIR/r6.json"
fi

# --- Boards: update ---
if [ -n "$BOARD_ID" ]; then
  echo "[7] PATCH /api/v1/boards/$BOARD_ID"
  curl -s -o "$TMPDIR/r7.json" -w "  Status: %{http_code}\n" -X PATCH "$BASE_URL/api/v1/boards/$BOARD_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test board (updated)"}'
  show_json "$TMPDIR/r7.json"
fi

# --- Goals: create ---
GOAL_ID=""
if [ -n "$BOARD_ID" ]; then
  echo "[8] POST /api/v1/boards/$BOARD_ID/goals"
  curl -s -o "$TMPDIR/r8.json" -w "  Status: %{http_code}\n" -X POST "$BASE_URL/api/v1/boards/$BOARD_ID/goals" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"Script goal","description":"Created by test script","completed":false}'
  GOAL_ID=$(json_get id "$TMPDIR/r8.json")
  echo "  Goal ID: ${GOAL_ID:-<none>}"
  show_json "$TMPDIR/r8.json"
fi

# --- Goals: update ---
if [ -n "$GOAL_ID" ]; then
  echo "[9] PATCH /api/v1/goals/$GOAL_ID"
  curl -s -o "$TMPDIR/r9.json" -w "  Status: %{http_code}\n" -X PATCH "$BASE_URL/api/v1/goals/$GOAL_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"description":"Updated by script"}'
  show_json "$TMPDIR/r9.json"
fi

# --- Tasks: list ---
echo "[10] GET /api/v1/entries/tasks"
curl -s -o "$TMPDIR/r10.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/entries/tasks" \
  -H "Authorization: Bearer $TOKEN"
show_json "$TMPDIR/r10.json"

# --- Tasks: create ---
echo "[11] POST /api/v1/entries/tasks"
curl -s -o "$TMPDIR/r11.json" -w "  Status: %{http_code}\n" -X POST "$BASE_URL/api/v1/entries/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Task from script\",\"goal_id\":\"${GOAL_ID:-null}\"}"
TASK_ID=$(json_get id "$TMPDIR/r11.json")
echo "  Task ID: ${TASK_ID:-<none>}"
show_json "$TMPDIR/r11.json"

# --- Tasks: update (complete) ---
if [ -n "$TASK_ID" ]; then
  echo "[12] PATCH /api/v1/entries/tasks/$TASK_ID"
  curl -s -o "$TMPDIR/r12.json" -w "  Status: %{http_code}\n" -X PATCH "$BASE_URL/api/v1/entries/tasks/$TASK_ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"completed":true}'
  show_json "$TMPDIR/r12.json"
fi

# --- Journal: list ---
echo "[13] GET /api/v1/entries/journal"
curl -s -o "$TMPDIR/r13.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/entries/journal?limit=5" \
  -H "Authorization: Bearer $TOKEN"
show_json "$TMPDIR/r13.json"

# --- Journal: create ---
echo "[14] POST /api/v1/entries/journal"
JOURNAL_GOAL_IDS="[]"
[ -n "$GOAL_ID" ] && JOURNAL_GOAL_IDS="[\"$GOAL_ID\"]"
curl -s -o "$TMPDIR/r14.json" -w "  Status: %{http_code}\n" -X POST "$BASE_URL/api/v1/entries/journal" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"content\":\"Journal entry from script\",\"goal_ids\":$JOURNAL_GOAL_IDS,\"entry_date\":null}"
show_json "$TMPDIR/r14.json"

# --- Progress: board ---
if [ -n "$BOARD_ID" ]; then
  echo "[15] GET /api/v1/progress/board/$BOARD_ID"
  curl -s -o "$TMPDIR/r15.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/progress/board/$BOARD_ID" \
    -H "Authorization: Bearer $TOKEN"
  show_json "$TMPDIR/r15.json"
fi

# --- Progress: confidence ---
echo "[16] GET /api/v1/progress/confidence"
curl -s -o "$TMPDIR/r16.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/progress/confidence" \
  -H "Authorization: Bearer $TOKEN"
show_json "$TMPDIR/r16.json"

# --- AI: insights ---
echo "[17] GET /api/v1/ai/insights"
curl -s -o "$TMPDIR/r17.json" -w "  Status: %{http_code}\n" "$BASE_URL/api/v1/ai/insights" \
  -H "Authorization: Bearer $TOKEN"
show_json "$TMPDIR/r17.json"

# --- AI: feedback ---
echo "[18] POST /api/v1/ai/feedback"
curl -s -o "$TMPDIR/r18.json" -w "  Status: %{http_code}\n" -X POST "$BASE_URL/api/v1/ai/feedback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"rating":"yes"}'
show_json "$TMPDIR/r18.json"

# --- Auth: PATCH me (profile) ---
echo "[19] PATCH /api/v1/auth/me"
curl -s -o "$TMPDIR/r19.json" -w "  Status: %{http_code}\n" -X PATCH "$BASE_URL/api/v1/auth/me" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name":"Demo User"}'
show_json "$TMPDIR/r19.json"

# --- Cleanup: delete task, goal, board (optional) ---
if [ -n "$TASK_ID" ]; then
  echo "[20] DELETE /api/v1/entries/tasks/$TASK_ID"
  curl -s -o /dev/null -w "  Status: %{http_code}\n" -X DELETE "$BASE_URL/api/v1/entries/tasks/$TASK_ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
fi
if [ -n "$GOAL_ID" ]; then
  echo "[21] DELETE /api/v1/goals/$GOAL_ID"
  curl -s -o /dev/null -w "  Status: %{http_code}\n" -X DELETE "$BASE_URL/api/v1/goals/$GOAL_ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
fi
if [ -n "$BOARD_ID" ]; then
  echo "[22] DELETE /api/v1/boards/$BOARD_ID"
  curl -s -o /dev/null -w "  Status: %{http_code}\n" -X DELETE "$BASE_URL/api/v1/boards/$BOARD_ID" \
    -H "Authorization: Bearer $TOKEN"
  echo ""
fi

# Voice transcribe requires a real audio file; skip in script or run manually:
# curl -X POST "$BASE_URL/api/v1/voice/transcribe" -H "Authorization: Bearer $TOKEN" -F "file=@/path/to/audio.m4a"

echo "=== Done ==="
