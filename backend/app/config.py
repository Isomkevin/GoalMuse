from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database: SQLite by default; set DATABASE_URL for Postgres (e.g. postgresql://user:pass@localhost/db)
    database_url: str = "sqlite:///./goal_muse.db"

    # JWT
    secret_key: str = "change-me-in-production-use-env"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # AI (optional: agents no-op if not set)
    # Provider: "openai" | "openrouter" | "gemini"
    llm_provider: str = "openai"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # OpenRouter (when llm_provider="openrouter")
    openrouter_api_key: str = ""
    openrouter_model: str = "openai/gpt-4o-mini"

    # Gemini (when llm_provider="gemini")
    google_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Voice STT: "openai" (Whisper) or "groq" (free tier). At least one key required for voice.
    voice_provider: str = "groq"
    groq_api_key: str = ""

    # Opik observability (optional: tracing disabled if not set)
    opik_api_key: str = ""
    opik_workspace: str = ""
    opik_project_name: str = "goal-muse"
    opik_run_evals: bool = False  # When True, run LLM-as-judge evals per insight and log to trace

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
