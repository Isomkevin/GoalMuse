from pydantic import BaseModel


class LLMPreferenceUpdate(BaseModel):
    provider: str  # openai | openrouter | gemini
    model: str | None = None  # optional override for selected provider
