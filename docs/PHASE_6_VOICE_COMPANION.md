# Phase 6 — Voice Companion

## Goal

Lightweight voice interaction that **reduces friction** without adding complexity: morning planning, end-of-day reflection, and gentle nudges. Voice augments the UI; 2–3 focused flows with graceful failure.

## Implemented

### Backend

- **`POST /api/v1/voice/transcribe`**  
  - Auth: Bearer JWT required.  
  - Body: multipart form with `file` (audio: m4a, mp3, wav, webm; max 25MB).  
  - Uses OpenAI Whisper when `OPENAI_API_KEY` is set.  
  - **Graceful failure:** If no API key, returns `503` with message: *"Voice transcription is not configured. Set OPENAI_API_KEY to enable."*

### Frontend

- **Dependencies:** `expo-speech` (TTS), `expo-av` (recording).
- **Voice tab:** New tab "Voice" with microphone icon; three flows:
  1. **Morning planning** — "Start my day": TTS summarizes goals and next action, then user can "Say your intention" → record → transcribe → create task.
  2. **End-of-day reflection** — "Reflect on today": TTS prompts, then record → transcribe → save as journal entry.
  3. **Gentle nudge** — "Read my next action": TTS speaks the current next action + reason from Insights (or fallback message).
- **`useVoice` hook:** `speak()`, `startRecording()`, `stopRecordingAndTranscribe()`, permission handling, and clear error state.
- **API:** `voiceApi.transcribe(token, audioUri, mimeType)`; mock token returns a short message instead of calling backend.
- **Fail gracefully:**  
  - No mic permission → message and no crash.  
  - Transcribe fails (e.g. no backend/Whisper) → "Transcription failed. Try typing instead."  
  - TTS fails → "Speech playback failed. Read the text on screen."
- **Permissions:** iOS `NSMicrophoneUsageDescription`, Android `RECORD_AUDIO` in `app.json`.

## Exit criteria

- Voice feels helpful and is limited to 2–3 flows.  
- No confusion: clear labels (Start my day / Reflect on today / Read my next action) and recording hints.  
- Works reliably in demo: TTS works with Expo; STT works when backend has Whisper configured; otherwise the app degrades to typing and clear messages.
