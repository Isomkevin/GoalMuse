/**
 * useVoice: Recording, transcription, and TTS for Goal Muse voice flows.
 * Handles permissions, recording, transcribe via backend (or mock), and speak (TTS).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Speech from 'expo-speech';
import { transcribe, TranscribeResult } from '../lib/voiceApi';

const MAX_RECORD_SECONDS = 60;
const MIME_M4A = 'audio/m4a';

export type VoiceFlow = 'task' | 'reflection' | 'generic';

export interface UseVoiceOptions {
  /** Callback to get auth token for backend transcribe. Return null for mock. */
  getToken?: () => string | null | Promise<string | null>;
  flow?: VoiceFlow;
}

export interface UseVoiceReturn {
  /** Whether mic permission has been granted */
  hasPermission: boolean | null;
  /** Whether we're currently recording */
  isRecording: boolean;
  /** Whether we're transcribing (after stop) */
  isTranscribing: boolean;
  /** Recording duration in seconds */
  recordSeconds: number;
  /** Last transcribed text (or null) */
  transcript: string | null;
  /** Error message (permission, TTS, transcribe failure) */
  error: string | null;
  /** Clear error state */
  clearError: () => void;
  /** Start recording. Resolves when started or rejects on permission failure. */
  startRecording: () => Promise<void>;
  /** Stop recording and transcribe. Returns transcribed text. */
  stopRecordingAndTranscribe: () => Promise<TranscribeResult | null>;
  /** Speak text via TTS */
  speak: (text: string, onDone?: () => void) => void;
  /** Stop TTS playback */
  stopSpeaking: () => void;
  /** Check if TTS is currently playing */
  isSpeaking: boolean;
  /** Request mic permission; returns true if granted */
  requestPermission: () => Promise<boolean>;
}

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { getToken, flow = 'generic' } = options;
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 500);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recordStartTimeRef = useRef<number>(0);
  const recordIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      setHasPermission(granted);
      if (granted) {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      }
      return granted;
    } catch {
      setHasPermission(false);
      setError('Could not access microphone.');
      return false;
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await getRecordingPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }).catch(() => {});
      }
    })();
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    if (hasPermission === false) {
      const ok = await requestPermission();
      if (!ok) {
        setError('Microphone permission denied. Enable it in Settings to use voice.');
        throw new Error('Microphone permission denied');
      }
    }
    if (hasPermission === null) {
      const ok = await requestPermission();
      if (!ok) {
        setError('Microphone permission denied. Enable it in Settings to use voice.');
        throw new Error('Microphone permission denied');
      }
    }
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      recordStartTimeRef.current = Date.now();
      recordIntervalRef.current = setInterval(() => {}, 500);
    } catch (e) {
      setError('Could not start recording.');
      throw e;
    }
  }, [hasPermission, requestPermission, recorder]);

  const stopRecordingAndTranscribe = useCallback(async (): Promise<TranscribeResult | null> => {
    if (!recorder.isRecording) return null;
    if (recordIntervalRef.current) {
      clearInterval(recordIntervalRef.current);
      recordIntervalRef.current = null;
    }
    try {
      await recorder.stop();
    } catch {
      setError('Could not stop recording.');
      return null;
    }
    const uri = recorder.uri;
    if (!uri) {
      setError('No recording available.');
      return null;
    }
    setIsTranscribing(true);
    setError(null);
    try {
      const token = typeof getToken === 'function' ? await getToken() : null;
      const result = await transcribe(token, uri, MIME_M4A, flow);
      setTranscript(result.text);
      return result;
    } catch {
      setError('Transcription failed. Try typing instead.');
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, [recorder, getToken, flow]);

  const speak = useCallback((text: string, onDone?: () => void) => {
    setError(null);
    if (!text.trim()) return;
    try {
      setIsSpeaking(true);
      Speech.speak(text, {
        language: 'en-US',
        onDone: () => {
          setIsSpeaking(false);
          onDone?.();
        },
        onStopped: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          setError('Speech playback failed. Read the text on screen.');
        },
      });
    } catch {
      setError('Speech playback failed. Read the text on screen.');
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const recordSeconds = recorderState.isRecording
    ? Math.min(Math.floor(recorderState.durationMillis / 1000), MAX_RECORD_SECONDS)
    : 0;

  return {
    hasPermission,
    isRecording: recorderState.isRecording,
    isTranscribing,
    recordSeconds,
    transcript,
    error,
    clearError,
    startRecording,
    stopRecordingAndTranscribe,
    speak,
    stopSpeaking,
    isSpeaking,
    requestPermission,
  };
}
