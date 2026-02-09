/**
 * VoiceInputModal: Inline mic shortcut for Tasks and Journal.
 * Records voice, transcribes (backend or mock), then calls onSave(text).
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colors } from '../theme/colors';
import { useVoice } from '../hooks/useVoice';

type VoiceInputMode = 'task' | 'journal';

interface VoiceInputModalProps {
  visible: boolean;
  mode: VoiceInputMode;
  onDismiss: () => void;
  onSave: (text: string) => void;
}

const VISUALIZER_HEIGHTS = [4, 6, 10, 8, 5, 12, 7, 9, 6, 4];

export function VoiceInputModal({ visible, mode, onDismiss, onSave }: VoiceInputModalProps) {
  const insets = useSafeAreaInsets();

  const voice = useVoice({
    flow: mode === 'task' ? 'task' : 'reflection',
    getToken: () => null,
  });

  const handleStart = async () => {
    try {
      await voice.startRecording();
    } catch {
      onDismiss();
    }
  };

  const handleSave = async () => {
    const result = await voice.stopRecordingAndTranscribe();
    if (result?.text?.trim()) {
      onSave(result.text.trim());
    }
    onDismiss();
  };

  const handleCancel = () => {
    if (voice.isRecording) {
      voice.stopRecordingAndTranscribe();
    }
    voice.stopSpeaking();
    onDismiss();
  };

  const title = mode === 'task' ? 'Add task by voice' : 'Add journal entry by voice';
  const placeholder =
    mode === 'task'
      ? '"Call dentist at 2pm tomorrow"'
      : '"Today I made progress on my portfolio..."';

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={handleCancel}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          {voice.error && (
            <View style={styles.errorRow}>
              <Icon name="error_outline" size={18} color={colors.red} />
              <Text style={styles.errorText}>{voice.error}</Text>
              <Pressable onPress={voice.clearError}>
                <Icon name="close" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          {!voice.isRecording && !voice.isTranscribing && (
            <>
              <View style={styles.micWrap}>
                <Pressable style={styles.micBtn} onPress={handleStart}>
                  <Icon name="mic" size={36} color={colors.white} />
                </Pressable>
              </View>
              <Text style={styles.hint}>Tap mic to start recording</Text>
              <Text style={styles.placeholder}>{placeholder}</Text>
            </>
          )}

          {(voice.isRecording || voice.isTranscribing) && (
            <>
              <View style={styles.recordingHeader}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTitle}>
                  {voice.isTranscribing ? 'Transcribing...' : 'Recording...'}
                </Text>
                {voice.isRecording && (
                  <Text style={styles.recordingTime}>
                    00:{String(voice.recordSeconds).padStart(2, '0')}
                  </Text>
                )}
              </View>
              {voice.isTranscribing ? (
                <View style={styles.spinnerRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.spinnerText}>Processing...</Text>
                </View>
              ) : (
                <View style={styles.visualizer}>
                  {VISUALIZER_HEIGHTS.map((h, i) => (
                    <View key={i} style={[styles.visualizerBar, { height: h * 2 }]} />
                  ))}
                </View>
              )}
              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                  <Icon name="close" size={24} color={colors.red} />
                </Pressable>
                <Pressable
                  style={styles.saveBtn}
                  onPress={handleSave}
                  disabled={voice.isTranscribing}
                >
                  <Icon name="check" size={28} color={colors.white} />
                </Pressable>
              </View>
            </>
          )}

          <Pressable style={styles.doneBtn} onPress={handleCancel}>
            <Text style={styles.doneBtnText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    minHeight: 280,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gray200,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: colors.redLight,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 14, color: colors.red },
  micWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 8 },
  placeholder: {
    fontSize: 14,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  recordingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  recordingTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  recordingTime: { fontSize: 14, color: colors.primary },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  spinnerText: { fontSize: 14, color: colors.textMuted },
  visualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    height: 40,
    marginBottom: 20,
  },
  visualizerBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 16,
  },
  cancelBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
});
