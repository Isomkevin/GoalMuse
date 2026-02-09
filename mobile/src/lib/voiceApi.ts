/**
 * Voice API: Transcribe audio via backend (Groq or OpenAI Whisper).
 * Backend returns structured errors (code + message) for quota/rate limit;
 * we surface those to the UI. Falls back to mock when no token or 503 without code.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface TranscribeResult {
  text: string;
  /** True if backend responded successfully; false for mock fallback */
  fromBackend: boolean;
}

/** Backend error codes (match backend voice route) */
export const VOICE_NOT_CONFIGURED = 'VOICE_NOT_CONFIGURED';
export const VOICE_QUOTA_EXCEEDED = 'VOICE_QUOTA_EXCEEDED';
export const VOICE_RATE_LIMITED = 'VOICE_RATE_LIMITED';
export const VOICE_PROVIDER_ERROR = 'VOICE_PROVIDER_ERROR';

/** Thrown when backend returns a structured error (quota, rate limit, etc.) so UI can show the message. */
export class VoiceApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'VoiceApiError';
  }
}

/** Parse backend error response: detail can be { code, message } or string */
function parseDetail(detail: unknown): { code: string; message: string } | null {
  if (typeof detail === 'string') {
    return { code: VOICE_PROVIDER_ERROR, message: detail };
  }
  if (detail && typeof detail === 'object' && 'message' in detail) {
    const d = detail as { code?: string; message?: string };
    return {
      code: typeof d.code === 'string' ? d.code : VOICE_PROVIDER_ERROR,
      message: typeof d.message === 'string' ? d.message : 'Transcription failed.',
    };
  }
  return null;
}

const MOCK_TRANSCRIPT_TASK = "Focus on deep work for two hours this morning.";
const MOCK_TRANSCRIPT_REFLECTION = "Today I made progress on my portfolio. I'll prioritize the case studies tomorrow.";
const MOCK_TRANSCRIPT_GENERIC = "Your voice input was captured. Backend transcription will appear when connected.";

function getMock(flow?: 'task' | 'reflection' | 'generic'): string {
  return flow === 'reflection' ? MOCK_TRANSCRIPT_REFLECTION : flow === 'task' ? MOCK_TRANSCRIPT_TASK : MOCK_TRANSCRIPT_GENERIC;
}

/**
 * Transcribe audio file to text.
 * Uses backend POST /api/v1/voice/transcribe (Groq or OpenAI).
 * On 503 with structured detail (quota/rate limit), throws VoiceApiError so the app can show the message.
 * Falls back to mock text when: no token, 503 without code (not configured), or network error.
 */
export async function transcribe(
  token: string | null,
  audioUri: string,
  mimeType: string = 'audio/m4a',
  flow?: 'task' | 'reflection' | 'generic'
): Promise<TranscribeResult> {
  if (!token || !token.trim()) {
    return { text: getMock(flow), fromBackend: false };
  }

  try {
    const formData = new FormData();
    const fileName = audioUri.split('/').pop() ?? 'recording.m4a';
    formData.append('file', {
      uri: audioUri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob);

    const res = await fetch(`${API_BASE}/api/v1/voice/transcribe`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const body = await res.json().catch(() => ({})) as { detail?: unknown };

    if (res.status === 503) {
      const parsed = parseDetail(body.detail);
      if (parsed) {
        throw new VoiceApiError(parsed.message, parsed.code);
      }
      return { text: getMock(flow), fromBackend: false };
    }

    if (res.status === 429) {
      const parsed = parseDetail(body.detail);
      throw new VoiceApiError(
        parsed?.message ?? 'Too many requests. Try again in a few minutes.',
        parsed?.code ?? VOICE_RATE_LIMITED,
      );
    }

    if (!res.ok) {
      const parsed = parseDetail(body.detail);
      if (parsed) {
        throw new VoiceApiError(parsed.message, parsed.code);
      }
      throw new VoiceApiError(`Transcription failed (${res.status}).`, VOICE_PROVIDER_ERROR);
    }

    const data = body as { text?: string };
    const text = (data.text ?? '').trim();
    return { text: text || MOCK_TRANSCRIPT_GENERIC, fromBackend: true };
  } catch (e) {
    if (e instanceof VoiceApiError) {
      throw e;
    }
    return { text: getMock(flow), fromBackend: false };
  }
}
