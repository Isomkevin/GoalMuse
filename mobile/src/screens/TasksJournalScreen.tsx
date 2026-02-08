import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../context/AppStateContext';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

function formatJournalDate(dateStr: string): { label: string; isRecent: boolean } {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  d.setHours(0, 0, 0, 0);
  if (d.getTime() === today.getTime()) return { label: 'Today', isRecent: true };
  if (d.getTime() === yesterday.getTime()) return { label: 'Yesterday', isRecent: true };
  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label: formatted, isRecent: false };
}

export function TasksJournalScreen() {
  const navigation = useNavigation<any>();
  const { tasks, addTask, toggleTask, journal, addJournalEntry, goals, getGoalById } = useAppState();
  const [activeTab, setActiveTab] = useState<'Tasks' | 'Journal'>('Tasks');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newJournalContent, setNewJournalContent] = useState('');
  const [selectedGoalIdForEntry, setSelectedGoalIdForEntry] = useState<string | null>(null);
  const [goalPickerVisible, setGoalPickerVisible] = useState(false);
  const remaining = tasks.filter((t) => !t.completed).length;
  const activeGoals = goals.filter((g) => !g.completed);

  const handleSaveEntry = () => {
    if (!newJournalContent.trim()) return;
    addJournalEntry(newJournalContent.trim(), selectedGoalIdForEntry ?? undefined);
    setNewJournalContent('');
    setSelectedGoalIdForEntry(null);
  };

  return (
    <View style={styles.container}>
      <AppBar title="GoalMuse" />
      <View style={styles.segmented}>
        <Pressable style={[styles.segBtn, activeTab === 'Tasks' && styles.segBtnActive]} onPress={() => setActiveTab('Tasks')}>
          <Text style={[styles.segText, activeTab === 'Tasks' && styles.segTextActive]}>Tasks</Text>
        </Pressable>
        <Pressable style={[styles.segBtn, activeTab === 'Journal' && styles.segBtnActive]} onPress={() => setActiveTab('Journal')}>
          <Text style={[styles.segText, activeTab === 'Journal' && styles.segTextActive]}>Journal</Text>
        </Pressable>
      </View>
      {activeTab === 'Tasks' ? (
        <>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>New Task</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder="Next step?" placeholderTextColor={colors.textMuted} value={newTaskTitle} onChangeText={setNewTaskTitle} />
              <Icon name="edit_note" size={24} color={colors.textMuted} />
            </View>
            <Pressable style={styles.addTaskBtn} onPress={() => { if (newTaskTitle.trim()) { addTask(newTaskTitle.trim()); setNewTaskTitle(''); } }}>
              <Icon name="add_circle" size={20} color={colors.white} />
              <Text style={styles.addTaskBtnText}>Add to List</Text>
            </Pressable>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Goals</Text>
            <Text style={styles.remaining}>{remaining} remaining</Text>
          </View>
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {tasks.map((task) => (
              <Pressable key={task.id} style={styles.taskRow} onPress={() => toggleTask(task.id)}>
                <View style={[styles.taskCheck, task.completed && styles.taskCheckDone]}>
                  {task.completed && <Icon name="check" size={14} color={colors.white} />}
                </View>
                <Text style={[styles.taskTitle, task.completed && styles.taskTitleDone]} numberOfLines={1}>{task.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : (
        <View style={styles.journalWrap}>
          <Text style={styles.inputLabel}>Today's Reflection</Text>
          <TextInput style={styles.journalInput} placeholder="What did you do today?" placeholderTextColor={colors.textMuted} value={newJournalContent} onChangeText={setNewJournalContent} multiline />
          <View style={styles.linkToGoalRow}>
            <Text style={styles.linkToGoalLabel}>Link to goal</Text>
            <Pressable style={styles.linkToGoalBtn} onPress={() => setGoalPickerVisible(true)}>
              <Text style={styles.linkToGoalBtnText} numberOfLines={1}>
                {selectedGoalIdForEntry ? getGoalById(selectedGoalIdForEntry)?.title ?? 'Unknown' : 'None'}
              </Text>
              <Icon name="arrow_drop_down" size={20} color={colors.primary} />
            </Pressable>
          </View>
          <Pressable style={styles.addTaskBtn} onPress={handleSaveEntry}>
            <Text style={styles.addTaskBtnText}>Save entry</Text>
          </Pressable>
          <Text style={styles.previousEntriesTitle}>Previous Entries</Text>
          <ScrollView style={styles.journalList} contentContainerStyle={styles.journalListContent}>
            {journal.slice(0, 20).map((entry) => {
              const { label: dateLabel, isRecent } = formatJournalDate(entry.date);
              const linkedGoal = entry.goalId ? getGoalById(entry.goalId) : null;
              return (
                <View key={entry.id} style={styles.journalEntry}>
                  <View style={styles.journalEntryHeader}>
                    <Text style={[styles.journalDate, isRecent && styles.journalDateRecent]}>{dateLabel.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.journalContent} numberOfLines={3}>{entry.content}</Text>
                  {linkedGoal && (
                    <Pressable
                      style={styles.goalBadge}
                      onPress={() => navigation.navigate('EditGoal', { goalId: entry.goalId! })}
                    >
                      <Icon name="track_changes" size={14} color={colors.primary} />
                      <Text style={styles.goalBadgeText} numberOfLines={1}>{linkedGoal.title}</Text>
                      <Icon name="arrow_forward" size={14} color={colors.primary} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
          <Modal visible={goalPickerVisible} transparent animationType="fade">
            <Pressable style={styles.modalBackdrop} onPress={() => setGoalPickerVisible(false)}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Link to goal</Text>
                <Pressable style={styles.modalOption} onPress={() => { setSelectedGoalIdForEntry(null); setGoalPickerVisible(false); }}>
                  <Text style={styles.modalOptionText}>None</Text>
                </Pressable>
                {activeGoals.map((g) => (
                  <Pressable
                    key={g.id}
                    style={styles.modalOption}
                    onPress={() => { setSelectedGoalIdForEntry(g.id); setGoalPickerVisible(false); }}
                  >
                    <Text style={styles.modalOptionText} numberOfLines={1}>{g.title}</Text>
                  </Pressable>
                ))}
              </View>
            </Pressable>
          </Modal>
        </View>
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundLight },
  segmented: { flexDirection: 'row', height: 48, margin: 16, backgroundColor: colors.gray100, borderRadius: 12, padding: 4 },
  segBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  segBtnActive: { backgroundColor: colors.white, elevation: 2 },
  segText: { fontSize: 14, fontWeight: '500', color: colors.textMuted },
  segTextActive: { fontWeight: '700', color: colors.primary },
  inputSection: { padding: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', height: 56, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 16, color: colors.text },
  addTaskBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 12, backgroundColor: colors.primary, marginTop: 12 },
  addTaskBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  remaining: { fontSize: 14, fontWeight: '600', color: colors.primary },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 100, gap: 12 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200 },
  taskCheck: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  taskCheckDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  taskTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: colors.text },
  taskTitleDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  journalWrap: { flex: 1, padding: 16 },
  journalInput: { minHeight: 120, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 16, fontSize: 16, color: colors.text, textAlignVertical: 'top' },
  linkToGoalRow: { marginTop: 12 },
  linkToGoalLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 6 },
  linkToGoalBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  linkToGoalBtnText: { fontSize: 15, color: colors.text, flex: 1 },
  previousEntriesTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 8 },
  journalList: { flex: 1 },
  journalListContent: { paddingBottom: 100 },
  journalEntry: { marginBottom: 16, padding: 16, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.gray200, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  journalEntryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  journalDate: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5 },
  journalDateRecent: { color: colors.primary },
  journalContent: { fontSize: 14, color: colors.text, lineHeight: 20 },
  goalBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.gray100 },
  goalBadgeText: { fontSize: 13, fontWeight: '600', color: colors.primary, flex: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalContent: { backgroundColor: colors.white, borderRadius: 16, padding: 16, maxHeight: 400 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  modalOption: { paddingVertical: 14, paddingHorizontal: 12, borderRadius: 8 },
  modalOptionText: { fontSize: 16, color: colors.text },
});
