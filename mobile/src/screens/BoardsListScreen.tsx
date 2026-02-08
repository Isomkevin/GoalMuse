import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../context/AppStateContext';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';

export function BoardsListScreen() {
  const navigation = useNavigation<any>();
  const { boards, addBoard } = useAppState();
  const isEmpty = boards.length === 0;

  return (
    <View style={styles.container}>
      <AppBar
        title="My boards"
        leftAction={
          <Pressable onPress={() => {}} style={styles.iconBtn}>
            <Icon name="settings" size={24} color={colors.text} />
          </Pressable>
        }
        rightAction={
          <Pressable
            onPress={() => {
              const id = addBoard('New board');
              navigation.navigate('BoardDetail', { boardId: id });
            }}
            style={styles.iconBtn}
          >
            <Icon name="add_circle" size={24} color={colors.text} />
          </Pressable>
        }
      />
      {isEmpty ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyContent}>
            <View style={styles.illusWrap}>
              <View style={styles.illusCircle} />
              <View style={[styles.illusCard, styles.illusCard1]}>
                <Icon name="image" size={40} color={colors.primary + '66'} />
              </View>
              <View style={[styles.illusCard, styles.illusCard2]}>
                <Icon name="edit_note" size={32} color={colors.primary + '4D'} />
              </View>
            </View>
            <Text style={styles.emptyTitle}>No boards yet</Text>
            <Text style={styles.emptyDesc}>
              Create your first vision board to start visualizing your future.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {boards.map((board) => (
            <Pressable
              key={board.id}
              style={styles.boardCard}
              onPress={() => navigation.navigate('BoardDetail', { boardId: board.id })}
            >
              <Text style={styles.boardTitle}>{board.title}</Text>
              <Text style={styles.boardMeta}>{board.goalIds?.length ?? 0} goals</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
      <View style={styles.bottomAction}>
        <Pressable
          style={styles.createBtn}
          onPress={() => {
            const id = addBoard('New board');
            navigation.navigate('BoardDetail', { boardId: id });
          }}
        >
          <Icon name="add" size={24} color={colors.white} />
          <Text style={styles.createBtnText}>Create board</Text>
        </Pressable>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  illusWrap: {
    width: 280,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  illusCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: colors.primaryLight,
  },
  illusCard: {
    position: 'absolute',
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  illusCard1: {
    width: 128,
    height: 128,
    transform: [{ rotate: '-6deg' }],
  },
  illusCard2: {
    width: 96,
    height: 96,
    right: -16,
    bottom: -8,
    transform: [{ rotate: '12deg' }],
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyDesc: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  boardCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  boardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  boardMeta: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  bottomAction: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  createBtn: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
});
