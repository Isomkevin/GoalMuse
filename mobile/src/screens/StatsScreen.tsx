import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import { progressApi, aiApi } from '../lib/api';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export function StatsScreen() {
  const navigation = useNavigation<any>();
  const { token } = useAuth();
  const { goals, tasks } = useAppState();
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [breakdown, setBreakdown] = useState<{
    task_completion: number;
    consistency: number;
    alignment: number;
    agent_confidence: number;
  } | null>(null);
  const [insights, setInsights] = useState<{
    alignment: { score: number; explanation: string };
    optimization: { action: string; reason: string };
  } | null>(null);
  const [loading, setLoading] = useState(!!token);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionPct = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const taskPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [conf, ins] = await Promise.all([
          progressApi.confidence(token).catch(() => null),
          aiApi.insights(token).catch(() => null),
        ]);
        if (conf) {
          setConfidenceScore(Math.round(conf.confidence_score));
          setBreakdown(conf.breakdown);
        }
        if (ins) setInsights(ins);
      } catch (_) {}
      setLoading(false);
    })();
  }, [token]);

  const handleFeedback = async (rating: 'yes' | 'no' | 'somewhat') => {
    if (!token || feedbackSent) return;
    try {
      await aiApi.feedback(token, rating);
      setFeedbackSent(true);
    } catch (_) {}
  };

  const score = confidenceScore ?? 72;
  const alignPct = breakdown ? Math.round(breakdown.alignment) : 90;
  const clarityPct = breakdown ? Math.round(breakdown.agent_confidence) : 85;
  const taskCompletionPct = breakdown ? Math.round(breakdown.task_completion) : completionPct;
  const consistencyPct = breakdown ? Math.round(breakdown.consistency) : taskPct;

  return (
    <View style={styles.container}>
      <AppBar title="AI Insights" />
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading insights…</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroLabel}>Progress confidence</Text>
                <Text style={styles.heroValue}>
                  {score}
                  <Text style={styles.heroUnit}>/100</Text>
                </Text>
              </View>
              <View style={styles.heroIconWrap}>
                <Icon name="auto_awesome" size={28} color={colors.primary} />
              </View>
            </View>
            <View style={styles.grid}>
              <View style={styles.statBox}>
                <View style={styles.statBoxHeader}>
                  <Icon name="check" size={20} color={colors.primary} />
                  <Text style={styles.statBoxTitle}>Completion</Text>
                </View>
                <Text style={styles.statBoxValue}>{taskCompletionPct}%</Text>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statBoxHeader}>
                  <Icon name="bar_chart" size={20} color={colors.primary} />
                  <Text style={styles.statBoxTitle}>Consistency</Text>
                </View>
                <Text style={styles.statBoxValue}>{consistencyPct}%</Text>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statBoxHeader}>
                  <Icon name="track_changes" size={20} color={colors.primary} />
                  <Text style={styles.statBoxTitle}>Alignment</Text>
                </View>
                <Text style={styles.statBoxValue}>{alignPct}%</Text>
              </View>
              <View style={styles.statBox}>
                <View style={styles.statBoxHeader}>
                  <Icon name="lightbulb" size={20} color={colors.primary} />
                  <Text style={styles.statBoxTitle}>Clarity</Text>
                </View>
                <Text style={styles.statBoxValue}>{clarityPct}%</Text>
              </View>
            </View>
          </View>
          {insights?.optimization?.action && (
            <View style={styles.nextActionCard}>
              <Text style={styles.nextActionLabel}>Suggested next action</Text>
              <Text style={styles.nextActionText}>{insights.optimization.action}</Text>
              {!feedbackSent && (
                <View style={styles.feedbackRow}>
                  <Text style={styles.feedbackLabel}>Did this help?</Text>
                  <View style={styles.feedbackBtns}>
                    <Pressable style={styles.feedbackBtn} onPress={() => handleFeedback('yes')}>
                      <Text style={styles.feedbackBtnText}>Yes</Text>
                    </Pressable>
                    <Pressable style={styles.feedbackBtn} onPress={() => handleFeedback('somewhat')}>
                      <Text style={styles.feedbackBtnText}>Somewhat</Text>
                    </Pressable>
                    <Pressable style={styles.feedbackBtn} onPress={() => handleFeedback('no')}>
                      <Text style={styles.feedbackBtnText}>No</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          )}
          <Pressable
            style={styles.voiceCard}
            onPress={() => navigation.navigate('Voice')}
          >
            <View style={styles.voiceCardLeft}>
              <Icon name="mic" size={28} color={colors.primary} />
              <View>
                <Text style={styles.voiceCardTitle}>Voice input</Text>
                <Text style={styles.voiceCardDesc}>
                  Set intentions or reflect with voice. Morning planning, reflection, or a gentle nudge.
                </Text>
              </View>
            </View>
            <Icon name="chevron_right" size={24} color={colors.textMuted} />
          </Pressable>
        </ScrollView>
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, color: colors.textMuted },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 16,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heroLabel: { fontSize: 14, fontWeight: '500', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { fontSize: 48, fontWeight: '700', color: colors.text },
  heroUnit: { fontSize: 24, color: colors.primary },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: {
    width: '47%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.gray50,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  statBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statBoxTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
  statBoxValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  nextActionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginBottom: 16,
  },
  nextActionLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 8 },
  nextActionText: { fontSize: 16, color: colors.text, lineHeight: 22 },
  feedbackRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.gray200 },
  feedbackLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  feedbackBtns: { flexDirection: 'row', gap: 8 },
  feedbackBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.gray100, borderRadius: 8 },
  feedbackBtnText: { fontSize: 14, color: colors.text },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
    marginTop: 8,
  },
  voiceCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  voiceCardTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 4 },
  voiceCardDesc: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
});
