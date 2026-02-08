import React from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../context/AppStateContext';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export function StatsScreen() {
  const navigation = useNavigation<any>();
  const { goals, tasks } = useAppState();
  const completedGoals = goals.filter((g) => g.completed).length;
  const totalGoals = goals.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const totalTasks = tasks.length;
  const completionPct = totalGoals ? Math.round((completedGoals / totalGoals) * 100) : 80;
  const taskPct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 65;

  return (
    <View style={styles.container}>
      <AppBar title="AI Insights" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroLabel}>Progress confidence</Text>
              <Text style={styles.heroValue}>72<Text style={styles.heroUnit}>/100</Text></Text>
            </View>
            <View style={styles.heroIconWrap}>
              <Icon name="auto_awesome" size={28} color={colors.primary} />
            </View>
          </View>
          <View style={styles.grid}>
            <View style={styles.statBox}>
              <View style={styles.statBoxHeader}><Icon name="check" size={20} color={colors.primary} /><Text style={styles.statBoxTitle}>Completion</Text></View>
              <Text style={styles.statBoxValue}>{completionPct}%</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statBoxHeader}><Icon name="bar_chart" size={20} color={colors.primary} /><Text style={styles.statBoxTitle}>Consistency</Text></View>
              <Text style={styles.statBoxValue}>{taskPct}%</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statBoxHeader}><Icon name="track_changes" size={20} color={colors.primary} /><Text style={styles.statBoxTitle}>Alignment</Text></View>
              <Text style={styles.statBoxValue}>90%</Text>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statBoxHeader}><Icon name="lightbulb" size={20} color={colors.primary} /><Text style={styles.statBoxTitle}>Clarity</Text></View>
              <Text style={styles.statBoxValue}>85%</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.voiceCard}
          onPress={() => navigation.navigate('Voice')}
        >
          <View style={styles.voiceCardLeft}>
            <Icon name="mic" size={28} color={colors.primary} />
            <View>
              <Text style={styles.voiceCardTitle}>Voice input</Text>
              <Text style={styles.voiceCardDesc}>Set intentions or reflect with voice. Morning planning, reflection, or a gentle nudge.</Text>
            </View>
          </View>
          <Icon name="chevron_right" size={24} color={colors.textMuted} />
        </Pressable>
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  heroCard: { backgroundColor: colors.white, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: colors.gray200, marginBottom: 16 },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  heroLabel: { fontSize: 14, fontWeight: '500', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  heroValue: { fontSize: 48, fontWeight: '700', color: colors.text },
  heroUnit: { fontSize: 24, color: colors.primary },
  heroIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '47%', padding: 12, borderRadius: 8, backgroundColor: colors.gray50, borderWidth: 1, borderColor: colors.gray200 },
  statBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  statBoxTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
  statBoxValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
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
