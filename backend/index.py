"""
Vercel serverless entry point.
Vercel looks for an `app` (ASGI) at app.py, index.py, or server.py.
Our FastAPI app lives in app.main, so we re-export it here.
"""
from app.main import app

__all__ = ["app"]
