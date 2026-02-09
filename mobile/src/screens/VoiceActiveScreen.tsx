import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';
import { useVoice } from '../hooks/useVoice';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';

type VoiceActiveParams = { flow?: string };

type VoiceFlow = 'morning' | 'reflection' | 'nudge';

const FLOW_LABELS: Record<string, string> = {
  morning: 'Morning planning',
  reflection: 'End-of-day reflection',
  nudge: 'Gentle nudge',
};

const VISUALIZER_HEIGHTS = [4, 6, 10, 8, 5, 12, 7, 9, 6, 4];

function toYYYYMMDD(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function VoiceActiveScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ VoiceActive: VoiceActiveParams }, 'VoiceActive'>>();
  const insets = useSafeAreaInsets();
  const flow = (route.params?.flow ?? 'morning') as VoiceFlow;
  const flowLabel = FLOW_LABELS[flow] ?? 'Morning planning';

  const { token } = useAuth();
  const { addTask, addJournalEntry, tasks, goals } = useAppState();
  const [hasSpokenTTS, setHasSpokenTTS] = useState(false);

  const voiceFlow: 'task' | 'reflection' | 'generic' =
    flow === 'morning' ? 'task' : flow === 'reflection' ? 'reflection' : 'generic';

  const voice = useVoice({
    flow: voiceFlow,
    getToken: () => token ?? null,
  });

  // Morning / Reflection: TTS prompt on mount
  useEffect(() => {
    if (flow === 'nudge') return;
    if (hasSpokenTTS) return;
    if (voice.isSpeaking) return;

    const text =
      flow === 'morning'
        ? getMorningPrompt(tasks, goals)
        : 'What went well today? What will you do differently tomorrow?';
    voice.speak(text, () => setHasSpokenTTS(true));
    return () => voice.stopSpeaking();
  }, [flow, hasSpokenTTS]);

  // Nudge flow: TTS speaks next action immediately
  useEffect(() => {
    if (flow !== 'nudge') return;
    const text = getNextActionPrompt(tasks, goals);
    voice.speak(text, () => setHasSpokenTTS(true));
    return () => voice.stopSpeaking();
  }, [flow]);

  const handleStartRecording = useCallback(async () => {
    try {
      await voice.startRecording();
    } catch {
      Alert.alert(
        'Microphone',
        'Microphone permission denied. Enable it in Settings to use voice.'
      );
    }
  }, [voice]);

  const handleStopAndSave = useCallback(async () => {
    if (flow === 'nudge') {
      voice.stopSpeaking();
      navigation.goBack();
      return;
    }
    const result = await voice.stopRecordingAndTranscribe();
    if (!result?.text?.trim()) return;
    const text = result.text.trim();

    if (flow === 'morning') {
      await addTask(text);
      navigation.goBack();
    } else if (flow === 'reflection') {
      await addJournalEntry(text, undefined, toYYYYMMDD(new Date()));
      navigation.goBack();
    }
  }, [flow, voice, addTask, addJournalEntry, navigation]);

  const handleCancel = useCallback(() => {
    if (voice.isRecording) {
      voice.stopRecordingAndTranscribe();
    }
    voice.stopSpeaking();
    navigation.goBack();
  }, [voice, navigation]);

  const showRecordingUI = (flow === 'morning' || flow === 'reflection') && (voice.isRecording || voice.isTranscribing);
  const showMicUI = (flow === 'morning' || flow === 'reflection') && !voice.isRecording && !voice.isTranscribing;
  const isNudge = flow === 'nudge';

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={handleCancel} style={styles.topBtn}>
          <Icon name="close" size={28} color={colors.primary} />
        </Pressable>
        {voice.isSpeaking && (
          <Pressable style={styles.stopBadge} onPress={() => voice.stopSpeaking()}>
            <Icon name="pause_circle" size={18} color={colors.primary} />
            <Text style={styles.stopBadgeText}>Stop playback</Text>
          </Pressable>
        )}
        {!voice.isSpeaking && <View style={styles.topSpacer} />}
      </View>

      <View style={styles.dimmedBg}>
        <Text style={styles.dimmedLabel}>Your Vision</Text>
        <View style={styles.dimmedGrid}>
          <View style={styles.dimmedBox} />
          <View style={styles.dimmedBox} />
          <View style={[styles.dimmedBox, styles.dimmedBoxWide]} />
        </View>
      </View>
      <View style={styles.overlay} pointerEvents="none" />

      <View style={[styles.card, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.cardHandle} />
        <Text style={styles.flowLabel}>{flowLabel}</Text>

        {voice.error && (
          <View style={styles.errorRow}>
            <Icon name="error_outline" size={20} color={colors.red} />
            <Text style={styles.errorText}>{voice.error}</Text>
            <Pressable onPress={voice.clearError} style={styles.errorDismiss}>
              <Icon name="close" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {isNudge && (
          <>
            <View style={styles.listeningRow}>
              {voice.isSpeaking ? (
                <>
                  <View style={styles.redDot}>
                    <View style={styles.redDotPing} />
                    <View style={styles.redDotInner} />
                  </View>
                  <Text style={styles.listeningText}>Playing...</Text>
                </>
              ) : (
                <Text style={styles.listeningText}>Your next action</Text>
              )}
            </View>
            <Text style={styles.nudgeHint}>
              {voice.isSpeaking
                ? 'Listen to your next action'
                : hasSpokenTTS
                  ? 'Tap below to hear again or close.'
                  : 'Preparing...'}
            </Text>
            <Pressable
              style={styles.primaryAction}
              onPress={() =>
                voice.isSpeaking
                  ? voice.stopSpeaking()
                  : voice.speak(getNextActionPrompt(tasks, goals))
              }
            >
              <Text style={styles.primaryActionText}>
                {voice.isSpeaking ? 'Stop' : 'Read my next action'}
              </Text>
            </Pressable>
            <Pressable style={styles.secondaryAction} onPress={handleCancel}>
              <Text style={styles.secondaryActionText}>Done</Text>
            </Pressable>
          </>
        )}

        {showMicUI && (
          <>
            <View style={styles.listeningRow}>
              {voice.isSpeaking ? (
                <>
                  <View style={styles.redDot}>
                    <View style={styles.redDotPing} />
                    <View style={styles.redDotInner} />
                  </View>
                  <Text style={styles.listeningText}>Listening...</Text>
                </>
              ) : (
                <Text style={styles.listeningText}>
                  {hasSpokenTTS ? 'Say your intention' : 'Preparing...'}
                </Text>
              )}
            </View>
            <View style={styles.micSection}>
              <View style={styles.pulseOuter} />
              <View style={styles.pulseMid} />
              <Pressable
                style={styles.micBtn}
                onPress={handleStartRecording}
                disabled={voice.isSpeaking}
              >
                <Icon name="mic" size={40} color={colors.white} />
              </Pressable>
            </View>
            <Text style={styles.transcriptPlaceholder}>
              {voice.transcript
                ? `"${voice.transcript}"`
                : flow === 'morning'
                  ? '"I want to focus on deep work for two hours this morning."'
                  : '"Today I made progress on my portfolio. I\'ll prioritize the case studies tomorrow."'}
            </Text>
            <Pressable
              style={[styles.primaryAction, !hasSpokenTTS && styles.primaryActionDisabled]}
              onPress={handleStartRecording}
              disabled={voice.isSpeaking || !hasSpokenTTS}
            >
              <Text style={styles.primaryActionText}>Say your intention</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction} onPress={handleCancel}>
              <Text style={styles.secondaryActionText}>Cancel</Text>
            </Pressable>
          </>
        )}

        {showRecordingUI && (
          <View style={styles.recordingSection}>
            <View style={styles.recordingHeader}>
              <View style={styles.recordingLabelRow}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTitle}>
                  {voice.isTranscribing ? 'Transcribing...' : 'Recording audio...'}
                </Text>
              </View>
              {!voice.isTranscribing && (
                <Text style={styles.recordingTime}>
                  00:{String(voice.recordSeconds).padStart(2, '0')} / 01:00
                </Text>
              )}
            </View>
            {voice.isTranscribing ? (
              <View style={styles.transcribingRow}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.transcribingText}>Processing your voice...</Text>
              </View>
            ) : (
              <View style={styles.visualizer}>
                {VISUALIZER_HEIGHTS.map((h, i) => (
                  <View key={i} style={[styles.visualizerBar, { height: h * 3 }]} />
                ))}
              </View>
            )}
            <View style={styles.listeningRow}>
              <Icon name="hearing" size={20} color={colors.primary} />
              <Text style={styles.listeningHint}>GoalMuse is listening</Text>
            </View>
            <View style={styles.recordingActions}>
              <Pressable style={styles.recordingBtnCancel} onPress={handleCancel}>
                <Icon name="close" size={24} color={colors.red} />
              </Pressable>
              <Pressable
                style={styles.recordingBtnSave}
                onPress={handleStopAndSave}
                disabled={voice.isTranscribing}
              >
                <Icon name="check" size={32} color={colors.backgroundDark} />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function getMorningPrompt(tasks: { title: string; completed: boolean }[], goals: { title: string }[]): string {
  const nextTask = tasks.find((t) => !t.completed);
  const activeGoals = goals.filter((g) => true).slice(0, 3);
  const goalTitles = activeGoals.map((g) => g.title).join(', ');
  if (nextTask && goalTitles) {
    return `Today's focus: ${goalTitles}. Your next action: ${nextTask.title}. Now say your intention for the day.`;
  }
  if (goalTitles) {
    return `Today's focus: ${goalTitles}. Say your intention for the day.`;
  }
  return 'Say your intention for the day.';
}

function getNextActionPrompt(tasks: { title: string; completed: boolean }[], goals: { title: string }[]): string {
  const nextTask = tasks.find((t) => !t.completed);
  const activeGoals = goals.filter((g) => true).slice(0, 2);
  const goalContext = activeGoals.length ? ` aligned with ${activeGoals[0].title}` : '';
  if (nextTask) {
    return `Your next action is: ${nextTask.title}${goalContext}.`;
  }
  return "You're all caught up. Great job! Consider adding a new task to move toward your goals.";
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 20,
  },
  topBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  stopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: colors.primaryLight,
  },
  stopBadgeText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  topSpacer: { width: 32 },
  dimmedBg: {
    flex: 1,
    padding: 16,
    opacity: 0.5,
  },
  dimmedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 16,
  },
  dimmedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  dimmedBox: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.gray200,
  },
  dimmedBoxWide: { width: '100%', aspectRatio: 4 / 3 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 30,
    marginTop: 60,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
    zIndex: 40,
  },
  cardHandle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    marginBottom: 24,
  },
  flowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.redLight,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 14, color: colors.red },
  errorDismiss: { padding: 4 },
  listeningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  redDot: { position: 'relative', width: 12, height: 12 },
  redDotPing: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f87171',
    opacity: 0.75,
  },
  redDotInner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
  },
  listeningText: { fontSize: 24, fontWeight: '700', color: colors.text },
  nudgeHint: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  pulseOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.primaryLight,
  },
  pulseMid: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: colors.primary + '33',
  },
  micBtn: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  transcriptPlaceholder: {
    fontSize: 18,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  primaryAction: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionDisabled: { opacity: 0.5 },
  secondaryAction: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: { fontSize: 14, fontWeight: '700', color: colors.text },
  recordingSection: { marginTop: 8 },
  recordingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  recordingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  recordingTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  recordingTime: { fontSize: 14, fontWeight: '500', color: colors.primary },
  transcribingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  transcribingText: { fontSize: 16, color: colors.textMuted },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 48,
    marginBottom: 12,
  },
  visualizerBar: {
    width: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  listeningHint: { fontSize: 14, fontWeight: '500', color: colors.textMuted, fontStyle: 'italic' },
  recordingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
  },
  recordingBtnCancel: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.redLight,
    borderWidth: 1,
    borderColor: colors.red + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBtnSave: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
