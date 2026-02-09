#!/usr/bin/env python3
"""
GoalMuse API smoke test. Uses demo@goalmuse.app / demo123.
Usage: python scripts/test_api.py [BASE_URL]
Example: python scripts/test_api.py https://goal-muse-backend.vercel.app
"""
import json
import sys
import urllib.request
import urllib.error

BASE_URL = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000").rstrip("/")
DEMO_EMAIL = "demo@goalmuse.app"
DEMO_PASSWORD = "demo123"


def req(method: str, path: str, token: str | None = None, body: dict | None = None) -> tuple[int, dict | list]:
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode() if body is not None else None
    req_obj = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req_obj, timeout=30) as r:
            text = r.read().decode()
            return r.status, json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"_raw": body}
    except Exception as e:
        print(f"  Error: {e}")
        return 0, {}


def main() -> None:
    print("=== GoalMuse API smoke test ===")
    print(f"Base URL: {BASE_URL}\n")

    # [1] Health
    print("[1] GET /health")
    status, data = req("GET", "/health")
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [2] Login
    print("[2] POST /api/v1/auth/login")
    status, data = req("POST", "/api/v1/auth/login", body={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    print(f"  Status: {status}")
    token = data.get("access_token") if isinstance(data, dict) else None
    if not token:
        print("  Login failed. Response:", json.dumps(data, indent=2))
        sys.exit(1)
    print(f"  Token: {token[:20]}...")
    print()

    # [3] Me
    print("[3] GET /api/v1/auth/me")
    status, data = req("GET", "/api/v1/auth/me", token=token)
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [4] Boards list
    print("[4] GET /api/v1/boards")
    status, data = req("GET", "/api/v1/boards", token=token)
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [5] Board create
    print("[5] POST /api/v1/boards")
    status, data = req("POST", "/api/v1/boards", token=token, body={"title": "Test board from script"})
    print(f"  Status: {status}")
    board_id = data.get("id") if isinstance(data, dict) else None
    if board_id:
        print(f"  Board ID: {board_id}")
    else:
        print("  Create board failed.")
    print(json.dumps(data, indent=2))
    print()

    # [6] Board get
    if board_id:
        print(f"[6] GET /api/v1/boards/{board_id}")
        status, data = req("GET", f"/api/v1/boards/{board_id}", token=token)
        print(f"  Status: {status}")
        print(json.dumps(data, indent=2))
        print()

    # [7] Board update
    if board_id:
        print(f"[7] PATCH /api/v1/boards/{board_id}")
        status, data = req("PATCH", f"/api/v1/boards/{board_id}", token=token, body={"title": "Test board (updated)"})
        print(f"  Status: {status}")
        print(json.dumps(data, indent=2))
        print()

    # [8] Goal create
    goal_id = None
    if board_id:
        print(f"[8] POST /api/v1/boards/{board_id}/goals")
        status, data = req(
            "POST",
            f"/api/v1/boards/{board_id}/goals",
            token=token,
            body={"title": "Script goal", "description": "Created by test script", "completed": False},
        )
        print(f"  Status: {status}")
        goal_id = data.get("id") if isinstance(data, dict) else None
        print(f"  Goal ID: {goal_id or '<none>'}")
        print(json.dumps(data, indent=2))
        print()

    # [9] Goal update
    if goal_id:
        print(f"[9] PATCH /api/v1/goals/{goal_id}")
        status, data = req("PATCH", f"/api/v1/goals/{goal_id}", token=token, body={"description": "Updated by script"})
        print(f"  Status: {status}")
        print(json.dumps(data, indent=2))
        print()

    # [10] Tasks list
    print("[10] GET /api/v1/entries/tasks")
    status, data = req("GET", "/api/v1/entries/tasks", token=token)
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [11] Task create
    print("[11] POST /api/v1/entries/tasks")
    status, data = req(
        "POST",
        "/api/v1/entries/tasks",
        token=token,
        body={"title": "Task from script", "goal_id": goal_id},
    )
    print(f"  Status: {status}")
    task_id = data.get("id") if isinstance(data, dict) else None
    print(f"  Task ID: {task_id or '<none>'}")
    print(json.dumps(data, indent=2))
    print()

    # [12] Task update
    if task_id:
        print(f"[12] PATCH /api/v1/entries/tasks/{task_id}")
        status, data = req("PATCH", f"/api/v1/entries/tasks/{task_id}", token=token, body={"completed": True})
        print(f"  Status: {status}")
        print(json.dumps(data, indent=2))
        print()

    # [13] Journal list
    print("[13] GET /api/v1/entries/journal")
    status, data = req("GET", "/api/v1/entries/journal?limit=5", token=token)
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [14] Journal create
    print("[14] POST /api/v1/entries/journal")
    status, data = req(
        "POST",
        "/api/v1/entries/journal",
        token=token,
        body={"content": "Journal entry from script", "goal_ids": [goal_id] if goal_id else [], "entry_date": None},
    )
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [15] Progress board
    if board_id:
        print(f"[15] GET /api/v1/progress/board/{board_id}")
        status, data = req("GET", f"/api/v1/progress/board/{board_id}", token=token)
        print(f"  Status: {status}")
        print(json.dumps(data, indent=2))
        print()

    # [16] Progress confidence
    print("[16] GET /api/v1/progress/confidence")
    status, data = req("GET", "/api/v1/progress/confidence", token=token)
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [17] AI insights
    print("[17] GET /api/v1/ai/insights")
    status, data = req("GET", "/api/v1/ai/insights", token=token)
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [18] AI feedback
    print("[18] POST /api/v1/ai/feedback")
    status, data = req("POST", "/api/v1/ai/feedback", token=token, body={"rating": "yes"})
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [19] PATCH me
    print("[19] PATCH /api/v1/auth/me")
    status, data = req("PATCH", "/api/v1/auth/me", token=token, body={"display_name": "Demo User"})
    print(f"  Status: {status}")
    print(json.dumps(data, indent=2))
    print()

    # [20-22] Cleanup
    if task_id:
        print(f"[20] DELETE /api/v1/entries/tasks/{task_id}")
        status, _ = req("DELETE", f"/api/v1/entries/tasks/{task_id}", token=token)
        print(f"  Status: {status}\n")
    if goal_id:
        print(f"[21] DELETE /api/v1/goals/{goal_id}")
        status, _ = req("DELETE", f"/api/v1/goals/{goal_id}", token=token)
        print(f"  Status: {status}\n")
    if board_id:
        print(f"[22] DELETE /api/v1/boards/{board_id}")
        status, _ = req("DELETE", f"/api/v1/boards/{board_id}", token=token)
        print(f"  Status: {status}\n")

    print("=== Done ===")


if __name__ == "__main__":
    main()
