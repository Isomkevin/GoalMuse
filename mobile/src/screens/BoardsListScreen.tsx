import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../context/AppStateContext';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';
import type { Board } from '../types';

const THUMB_SIZE = 72;
const CARD_BORDER_RADIUS = 16;

/** Pick a thematic icon for the board based on title. */
function getBoardIconName(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('resolution') || t.includes('goal') || t.includes('vision')) return 'target';
  if (t.includes('career') || t.includes('work') || t.includes('job')) return 'briefcase';
  if (t.includes('travel') || t.includes('adventure')) return 'explore';
  if (t.includes('wellness') || t.includes('health') || t.includes('fitness')) return 'person';
  return 'grid_view';
}

function ReadyForNewFocusBlock({
  onCreateBoard,
}: {
  onCreateBoard: () => void;
}) {
  return (
    <View style={styles.ctaBlock}>
      <View style={styles.ctaIconWrap}>
        <View style={styles.ctaIconCircle} />
        <View style={styles.ctaLayers}>
          <View style={[styles.ctaLayer, styles.ctaLayer1]} />
          <View style={[styles.ctaLayer, styles.ctaLayer2]} />
          <View style={[styles.ctaLayer, styles.ctaLayer3]} />
        </View>
      </View>
      <Text style={styles.ctaTitle}>Ready for a new focus?</Text>
      <Text style={styles.ctaDesc}>
        Create your next vision board to keep your dreams in sight.
      </Text>
      <Pressable style={styles.createBtn} onPress={onCreateBoard}>
        <Text style={styles.createBtnText}>Create board</Text>
      </Pressable>
    </View>
  );
}

export function BoardsListScreen() {
  const navigation = useNavigation<any>();
  const { boards, addBoard, deleteBoard } = useAppState();
  const isEmpty = boards.length === 0;

  const handleCreateBoard = () => {
    const id = addBoard('New board');
    navigation.navigate('BoardDetail', { boardId: id });
  };

  const handleDeleteBoard = (boardId: string, boardTitle: string) => {
    Alert.alert(
      'Delete board?',
      `"${boardTitle}" and all its goals will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteBoard(boardId) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="My boards."
        titleAlign="left"
        rightAction={
          <Pressable onPress={handleCreateBoard} style={styles.newBoardBtn}>
            <Icon name="add" size={20} color={colors.primary} />
            <Text style={styles.newBoardBtnText}>New board</Text>
          </Pressable>
        }
      />
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, isEmpty && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
      >
        {boards.map((board) => (
          <View key={board.id} style={styles.boardCard}>
            <Pressable
              style={styles.boardCardMain}
              onPress={() => navigation.navigate('BoardDetail', { boardId: board.id })}
            >
              <View style={styles.boardCardLeft}>
                <Text style={styles.boardTitle}>{board.title}</Text>
                <View style={styles.boardMetaRow}>
                  <Icon
                    name={getBoardIconName(board.title)}
                    size={18}
                    color={colors.textMuted}
                    style={styles.boardMetaIcon}
                  />
                  <Text style={styles.boardMeta}>
                    {board.goalIds?.length ?? 0} goals
                  </Text>
                </View>
              </View>
              <View style={styles.boardThumbWrap}>
                {board.coverImageUri ? (
                  <Image
                    source={{ uri: board.coverImageUri }}
                    style={styles.boardThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.boardThumbPlaceholder}>
                    <Icon name="image" size={28} color={colors.gray200} />
                  </View>
                )}
              </View>
            </Pressable>
            <Pressable
              style={styles.boardCardMenu}
              onPress={() => handleDeleteBoard(board.id, board.title)}
            >
              <Icon name="more_horiz" size={22} color={colors.textMuted} />
            </Pressable>
          </View>
        ))}
        <ReadyForNewFocusBlock onCreateBoard={handleCreateBoard} />
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
  newBoardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  newBoardBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  boardCard: {
    position: 'relative',
    backgroundColor: colors.white,
    borderRadius: CARD_BORDER_RADIUS,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  boardCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  boardCardMenu: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  boardCardLeft: {
    flex: 1,
    marginRight: 12,
    minWidth: 0,
  },
  boardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  boardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  boardMetaIcon: {
    marginRight: 6,
  },
  boardMeta: {
    fontSize: 14,
    color: colors.textMuted,
  },
  boardThumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  boardThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  boardThumbPlaceholder: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // "Ready for a new focus?" block
  ctaBlock: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  ctaIconWrap: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ctaIconCircle: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 44,
    backgroundColor: colors.primaryLight,
  },
  ctaLayers: {
    position: 'absolute',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLayer: {
    position: 'absolute',
    width: 28,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#065a75',
  },
  ctaLayer1: { transform: [{ rotate: '-12deg' }, { translateY: -2 }] },
  ctaLayer2: { transform: [{ rotate: '0deg' }] },
  ctaLayer3: { transform: [{ rotate: '12deg' }, { translateY: -2 }] },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  ctaDesc: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  createBtn: {
    height: 52,
    minWidth: 200,
    paddingHorizontal: 28,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
});
