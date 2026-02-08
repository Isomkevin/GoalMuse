import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../context/AppStateContext';
import { navigateToEditGoal } from '../navigation/rootNavigation';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export function GoalsListScreen() {
  const navigation = useNavigation<any>();
  const { goals, boards, updateGoal } = useAppState();
  const activeGoals = goals.filter((g) => !g.completed);
  const firstBoardId = boards[0]?.id;

  const formatDate = (d?: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleGoal = (id: string) => {
    const g = goals.find((x) => x.id === id);
    if (g) updateGoal(id, { completed: !g.completed });
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Goals"
        leftAction={
          <View style={styles.titleRow}>
            <Icon name="grid_view" size={24} color={colors.primary} />
          </View>
        }
        rightAction={
          <View style={styles.headerRight}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => navigation.navigate('TasksJournal')}
            >
              <Icon name="edit_note" size={24} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Icon name="search" size={24} color={colors.text} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Icon name="more_horiz" size={24} color={colors.text} />
            </Pressable>
          </View>
        }
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Pressable
          style={styles.tasksJournalCard}
          onPress={() => navigation.navigate('TasksJournal')}
        >
          <Icon name="edit_note" size={28} color={colors.primary} />
          <View style={styles.tasksJournalCardText}>
            <Text style={styles.tasksJournalCardTitle}>Tasks & Journal</Text>
            <Text style={styles.tasksJournalCardSub}>Daily tasks and reflections linked to goals</Text>
          </View>
          <Icon name="chevron_right" size={24} color={colors.textMuted} />
        </Pressable>
        <Pressable
          style={styles.addGoalBtn}
          onPress={() => navigation.navigate('AddGoal', { boardId: firstBoardId || '' })}
        >
          <Icon name="add" size={24} color={colors.white} />
          <Text style={styles.addGoalBtnText}>Add goal</Text>
        </Pressable>

        <Text style={styles.sectionLabel}>Active Vision Board</Text>

        {activeGoals.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No active goals. Add one above.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {goals.map((goal) => (
              <View
                key={goal.id}
                style={[styles.goalCard, goal.completed && styles.goalCardCompleted]}
              >
                <View style={styles.goalRow}>
                  <Pressable
                    style={[styles.checkbox, goal.completed && styles.checkboxChecked]}
                    onPress={() => toggleGoal(goal.id)}
                  >
                    {goal.completed && (
                      <Icon name="check" size={14} color={colors.white} />
                    )}
                  </Pressable>
                  <View style={styles.goalMain}>
                    <Text
                      style={[styles.goalTitle, goal.completed && styles.goalTitleCompleted]}
                      numberOfLines={1}
                    >
                      {goal.title}
                    </Text>
                    <Text style={styles.goalPriority}>
                      {goal.priority || 'Goal'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.goalDesc} numberOfLines={2}>
                  {goal.description || '—'}
                </Text>
                <View style={styles.goalFooter}>
                  <View style={styles.dateRow}>
                    <Icon name="calendar_today" size={16} color={colors.textMuted} />
                    <Text style={styles.dateText}>By {formatDate(goal.targetDate) || '—'}</Text>
                  </View>
                  <Pressable onPress={() => navigateToEditGoal(goal.id)}>
                    <Text style={styles.editLink}>Edit</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  tasksJournalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: 12,
  },
  tasksJournalCardText: { flex: 1, minWidth: 0 },
  tasksJournalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  tasksJournalCardSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  addGoalBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  addGoalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.gray400,
    marginBottom: 16,
  },
  list: {
    gap: 16,
  },
  goalCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardCompleted: {
    backgroundColor: colors.gray50,
    borderStyle: 'dashed',
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  goalMain: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  goalTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  goalPriority: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  goalDesc: {
    fontSize: 14,
    color: colors.textMutedDark,
    marginTop: 12,
    lineHeight: 20,
  },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  editLink: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
