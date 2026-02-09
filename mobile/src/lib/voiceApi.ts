/**
 * Voice API: Transcribe audio via backend (Whisper).
 * When backend is unavailable or returns 503, returns mock text for demo.
 * Set EXPO_PUBLIC_API_BASE_URL to your backend URL for production.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export interface TranscribeResult {
  text: string;
  /** True if backend responded successfully; false for mock fallback */
  fromBackend: boolean;
}

const MOCK_TRANSCRIPT_TASK = "Focus on deep work for two hours this morning.";
const MOCK_TRANSCRIPT_REFLECTION = "Today I made progress on my portfolio. I'll prioritize the case studies tomorrow.";
const MOCK_TRANSCRIPT_GENERIC = "Your voice input was captured. Backend transcription will appear when connected.";

/**
 * Transcribe audio file to text.
 * Uses backend POST /api/v1/voice/transcribe when available.
 * Falls back to mock text when: no token, backend 503, network error.
 */
export async function transcribe(
  token: string | null,
  audioUri: string,
  mimeType: string = 'audio/m4a',
  flow?: 'task' | 'reflection' | 'generic'
): Promise<TranscribeResult> {
  if (!token || !token.trim()) {
    const mock = flow === 'reflection' ? MOCK_TRANSCRIPT_REFLECTION : flow === 'task' ? MOCK_TRANSCRIPT_TASK : MOCK_TRANSCRIPT_GENERIC;
    return { text: mock, fromBackend: false };
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

    if (res.status === 503) {
      // Voice not configured on backend
      const mock = flow === 'reflection' ? MOCK_TRANSCRIPT_REFLECTION : flow === 'task' ? MOCK_TRANSCRIPT_TASK : MOCK_TRANSCRIPT_GENERIC;
      return { text: mock, fromBackend: false };
    }

    if (!res.ok) {
      throw new Error(`Transcribe failed: ${res.status}`);
    }

    const data = (await res.json()) as { text?: string };
    const text = (data.text ?? '').trim();
    return { text: text || MOCK_TRANSCRIPT_GENERIC, fromBackend: true };
  } catch {
    const mock = flow === 'reflection' ? MOCK_TRANSCRIPT_REFLECTION : flow === 'task' ? MOCK_TRANSCRIPT_TASK : MOCK_TRANSCRIPT_GENERIC;
    return { text: mock, fromBackend: false };
  }
}
