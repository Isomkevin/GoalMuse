import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

type VoiceActiveParams = { flow?: string };

const FLOW_LABELS: Record<string, string> = {
  morning: 'Morning planning',
  reflection: 'End-of-day reflection',
  nudge: 'Gentle nudge',
};

const VISUALIZER_HEIGHTS = [4, 6, 10, 8, 5, 12, 7, 9, 6, 4];

export function VoiceActiveScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ VoiceActive: VoiceActiveParams }, 'VoiceActive'>>();
  const insets = useSafeAreaInsets();
  const flow = route.params?.flow ?? 'morning';
  const flowLabel = FLOW_LABELS[flow] ?? 'Morning planning';
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  return (
    <View style={styles.container}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBtn}>
          <Icon name="close" size={28} color={colors.primary} />
        </Pressable>
        <Pressable style={styles.stopBadge}>
          <Icon name="pause_circle" size={18} color={colors.primary} />
          <Text style={styles.stopBadgeText}>Stop playback</Text>
        </Pressable>
        <View style={styles.topSpacer} />
      </View>

      {/* Dimmed background */}
      <View style={styles.dimmedBg}>
        <Text style={styles.dimmedLabel}>Your Vision</Text>
        <View style={styles.dimmedGrid}>
          <View style={styles.dimmedBox} />
          <View style={styles.dimmedBox} />
          <View style={[styles.dimmedBox, styles.dimmedBoxWide]} />
        </View>
      </View>
      <View style={styles.overlay} pointerEvents="none" />

      {/* Active voice card */}
      <View style={[styles.card, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.cardHandle} />
        <Text style={styles.flowLabel}>{flowLabel}</Text>
        <View style={styles.listeningRow}>
          <View style={styles.redDot}>
            <View style={styles.redDotPing} />
            <View style={styles.redDotInner} />
          </View>
          <Text style={styles.listeningText}>Listening...</Text>
        </View>

        {!isRecording ? (
          <>
            <View style={styles.micSection}>
              <View style={styles.pulseOuter} />
              <View style={styles.pulseMid} />
              <Pressable style={styles.micBtn}>
                <Icon name="mic" size={40} color={colors.white} />
              </Pressable>
            </View>
            <Text style={styles.transcriptPlaceholder}>
              &ldquo;I want to focus on deep work for two hours this morning.&rdquo;
            </Text>
            <Pressable style={styles.primaryAction} onPress={() => setIsRecording(true)}>
              <Text style={styles.primaryActionText}>Say your intention</Text>
            </Pressable>
            <Pressable style={styles.secondaryAction} onPress={() => navigation.goBack()}>
              <Text style={styles.secondaryActionText}>Stop & add task</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.recordingSection}>
            <View style={styles.recordingHeader}>
              <View style={styles.recordingLabelRow}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTitle}>Recording audio...</Text>
              </View>
              <Text style={styles.recordingTime}>00:{String(recordSeconds).padStart(2, '0')} / 00:45</Text>
            </View>
            <View style={styles.visualizer}>
              {VISUALIZER_HEIGHTS.map((h, i) => (
                <View key={i} style={[styles.visualizerBar, { height: h * 3 }]} />
              ))}
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '35%' }]} />
            </View>
            <View style={styles.listeningRow}>
              <Icon name="hearing" size={20} color={colors.primary} />
              <Text style={styles.listeningHint}>GoalMuse is listening</Text>
            </View>
            <View style={styles.recordingActions}>
              <Pressable style={styles.recordingBtnCancel} onPress={() => setIsRecording(false)}>
                <Icon name="close" size={24} color={colors.red} />
              </Pressable>
              <Pressable style={styles.recordingBtnSave} onPress={() => { setIsRecording(false); navigation.goBack(); }}>
                <Icon name="check" size={32} color={colors.backgroundDark} />
              </Pressable>
              <Pressable style={styles.recordingBtnPause} onPress={() => setIsRecording(false)}>
                <Icon name="pause" size={24} color={colors.text} />
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
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
  primaryActionText: { fontSize: 16, fontWeight: '700', color: colors.white },
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
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
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
  recordingBtnPause: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
