import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAppState } from '../context/AppStateContext';
import { navigateToEditGoal } from '../navigation/rootNavigation';
import { AppBar } from '../components/AppBar';
import { BottomNav } from '../components/BottomNav';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';
import type { Goal } from '../types';

type ParamList = { BoardDetail: { boardId: string } };

const NUM_COLUMNS = 2;
const GRID_PADDING = 16;
const GRID_GAP = 16;
const CARD_IMAGE_ASPECT = 1;
const CARD_BODY_HEIGHT = 80;
const LONG_PRESS_DURATION_MS = 400;

/**
 * Card content only (no gesture). Used for both grid cells and the drag overlay.
 * Shows placeholder if image URI is missing or fails to load.
 */
function GoalCardContent({
  goal,
  formatDate,
  isOverlay,
}: {
  goal: Goal;
  formatDate: (d?: string) => string;
  isOverlay?: boolean;
}) {
  const [imageError, setImageError] = useState(false);
  const showImage = goal.imageUri && !imageError;

  useEffect(() => {
    setImageError(false);
  }, [goal.id, goal.imageUri]);

  return (
    <View style={[styles.goalCard, isOverlay && styles.goalCardOverlay]}>
      <View style={styles.goalImageWrap}>
        {showImage ? (
          <Image
            source={{ uri: goal.imageUri }}
            style={styles.goalImage}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <Image
            source={require('../../assets/placeholder.png')}
            style={styles.goalImage}
            resizeMode="cover"
          />
        )}
      </View>
      <View style={styles.goalBody}>
        <Text style={styles.goalTitle} numberOfLines={1}>
          {goal.title}
        </Text>
        <Text style={styles.goalDesc} numberOfLines={2}>
          {goal.description || '—'}
        </Text>
        <View style={styles.goalMeta}>
          <Icon name="calendar_today" size={12} color={colors.primary} />
          <Text style={styles.goalDate}>{formatDate(goal.targetDate) || '—'}</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * One draggable card in the grid. Long-press on this card (and only this card) starts
 * the drag; the gesture handlers are attached to the card view, so the interaction
 * target is correct. We do not use react-native-draggable-flatlist so we have full
 * control over when drag starts (long-press) and the 2-column layout.
 */
function DraggableGoalCard({
  goal,
  formatDate,
  cardRef,
  onLongPressStartDrag,
  onDragEnd,
  dragTranslateX,
  dragTranslateY,
  isDragging,
}: {
  goal: Goal;
  formatDate: (d?: string) => string;
  cardRef: (el: View | null) => void;
  onLongPressStartDrag: (goalId: string) => void;
  onDragEnd: () => void;
  dragTranslateX: Animated.SharedValue<number>;
  dragTranslateY: Animated.SharedValue<number>;
  isDragging: boolean;
}) {
  const longPress = Gesture.LongPress()
    .minDuration(LONG_PRESS_DURATION_MS)
    .onStart(() => {
      runOnJS(onLongPressStartDrag)(goal.id);
    });

  const pan = Gesture.Pan()
    .minDistance(0)
    .onUpdate((e) => {
      dragTranslateX.value = e.translationX;
      dragTranslateY.value = e.translationY;
    })
    .onEnd(() => {
      runOnJS(onDragEnd)();
    });

  const composed = Gesture.Simultaneous(longPress, pan);

  return (
    <GestureDetector gesture={composed}>
      <View
        ref={cardRef}
        style={[styles.cardWrapper, isDragging && styles.cardWrapperDragging]}
        collapsable={false}
      >
        <Pressable onPress={() => !isDragging && navigateToEditGoal(goal.id)} style={styles.pressableCard}>
          <GoalCardContent goal={goal} formatDate={formatDate} />
        </Pressable>
      </View>
    </GestureDetector>
  );
}

export function BoardDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<ParamList, 'BoardDetail'>>();
  const { boardId } = route.params;
  const { boards, getOrderedGoalsByBoard, reorderBoardGoals, deleteBoard, deleteGoal } = useAppState();
  const board = boards.find((b) => b.id === boardId);
  const orderedGoals = getOrderedGoalsByBoard(boardId);

  const [goals, setGoals] = useState<Goal[]>(orderedGoals);
  const [draggingGoalId, setDraggingGoalId] = useState<string | null>(null);
  const [dragStartScreen, setDragStartScreen] = useState({ x: 0, y: 0 });
  const cardRefs = useRef<Record<string, View | null>>({});
  const dragTranslateX = useSharedValue(0);
  const dragTranslateY = useSharedValue(0);

  useEffect(() => {
    setGoals(getOrderedGoalsByBoard(boardId));
  }, [boardId, orderedGoals.length, getOrderedGoalsByBoard]);

  const formatDate = useCallback((d?: string) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
  }, []);

  const { width: screenWidth } = Dimensions.get('window');
  const contentWidth = screenWidth - GRID_PADDING * 2;
  const cardWidth = (contentWidth - GRID_GAP) / NUM_COLUMNS;

  const startDrag = useCallback(
    (goalId: string) => {
      if (goalId) {
        const view = cardRefs.current[goalId];
        if (view && 'measureInWindow' in view) {
          (view as any).measureInWindow((x: number, y: number) => {
            setDragStartScreen({ x, y });
            setDraggingGoalId(goalId);
            dragTranslateX.value = 0;
            dragTranslateY.value = 0;
          });
        } else {
          setDraggingGoalId(goalId);
          dragTranslateX.value = 0;
          dragTranslateY.value = 0;
        }
      } else {
        endDrag();
      }
    },
    [dragTranslateX, dragTranslateY]
  );

  const endDrag = useCallback(() => {
    if (!draggingGoalId) return;
    const fromIndex = goals.findIndex((g) => g.id === draggingGoalId);
    if (fromIndex === -1) {
      setDraggingGoalId(null);
      return;
    }
    const tx = dragTranslateX.value;
    const ty = dragTranslateY.value;
    const rowHeight = cardWidth * CARD_IMAGE_ASPECT + CARD_BODY_HEIGHT + GRID_GAP;
    const moveByRows = Math.round(ty / rowHeight);
    const moveByCols = Math.round(tx / (cardWidth + GRID_GAP));
    let toIndex = fromIndex + moveByRows * NUM_COLUMNS + moveByCols;
    toIndex = Math.max(0, Math.min(goals.length - 1, toIndex));
    if (toIndex === fromIndex) {
      setDraggingGoalId(null);
      dragTranslateX.value = 0;
      dragTranslateY.value = 0;
      return;
    }
    const reordered = [...goals];
    const [removed] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, removed);
    setGoals(reordered);
    reorderBoardGoals(boardId, reordered.map((g) => g.id));
    setDraggingGoalId(null);
    dragTranslateX.value = 0;
    dragTranslateY.value = 0;
  }, [boardId, draggingGoalId, goals, reorderBoardGoals, cardWidth, dragTranslateX, dragTranslateY]);

  const draggingGoal = draggingGoalId ? goals.find((g) => g.id === draggingGoalId) : null;

  const handleBoardOptions = useCallback(() => {
    if (!board) return;
    Alert.alert(board.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit board', onPress: () => navigation.navigate('EditBoard', { boardId }) },
      {
        text: 'Delete board',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete board?',
            `"${board.title}" and all its goals will be removed. This can't be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => { deleteBoard(boardId); navigation.goBack(); } },
            ]
          );
        },
      },
    ]);
  }, [board, boardId, deleteBoard, navigation]);

  const handleDeleteBoard = useCallback(() => {
    if (!board) return;
    Alert.alert(
      'Delete board?',
      `"${board.title}" and all its goals will be removed. This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteBoard(boardId); navigation.goBack(); } },
      ]
    );
  }, [board, boardId, deleteBoard, navigation]);

  const handleGoalOptions = useCallback((goal: Goal) => {
    Alert.alert(goal.title, undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Edit goal', onPress: () => navigateToEditGoal(goal.id) },
      { text: 'Delete goal', style: 'destructive', onPress: () => {
        Alert.alert('Delete goal?', 'This goal will be removed from the board.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(goal.id) },
        ]);
      } },
    ]);
  }, [deleteGoal]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: dragTranslateX.value },
      { translateY: dragTranslateY.value },
    ],
  }));

  if (!board) {
    return (
      <View style={styles.container}>
        <AppBar title="Board" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Board not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar
        title={board.title}
        showBack
        onBack={() => navigation.goBack()}
        subtitle={`${goals.length} active goals · Long-press a card to reorder`}
        rightAction={
          <Pressable style={styles.iconBtn} onPress={handleBoardOptions}>
            <Icon name="more_horiz" size={24} color={colors.text} />
          </Pressable>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.grid, { padding: GRID_PADDING, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {goals.map((goal) => (
          <View key={goal.id} style={[styles.cardSlot, { width: cardWidth }]}>
          <DraggableGoalCard
            goal={goal}
            formatDate={formatDate}
            cardRef={(el) => {
              cardRefs.current[goal.id] = el;
            }}
            onLongPressStartDrag={startDrag}
            onDragEnd={endDrag}
            dragTranslateX={dragTranslateX}
            dragTranslateY={dragTranslateY}
            isDragging={draggingGoalId === goal.id}
          />
          <Pressable
            style={styles.goalCardMenu}
            onPress={() => handleGoalOptions(goal)}
          >
            <Icon name="more_horiz" size={20} color={colors.textMuted} />
          </Pressable>
          </View>
        ))}
      </ScrollView>

      {draggingGoal && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.dragOverlay,
            {
              left: dragStartScreen.x,
              top: dragStartScreen.y,
              width: cardWidth,
            },
            overlayAnimatedStyle,
          ]}
        >
          <GoalCardContent goal={draggingGoal} formatDate={formatDate} isOverlay />
        </Animated.View>
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate('AddGoalFromBoard', { boardId })}
      >
        <Icon name="add" size={28} color={colors.white} />
      </Pressable>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textMuted,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  cardSlot: {
    position: 'relative',
    marginBottom: GRID_GAP,
  },
  goalCardMenu: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 10,
  },
  cardWrapper: {
    flex: 1,
  },
  cardWrapperDragging: {
    opacity: 0.4,
  },
  pressableCard: {
    flex: 1,
  },
  goalCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    overflow: 'hidden',
  },
  goalCardOverlay: {
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  goalImageWrap: {
    aspectRatio: CARD_IMAGE_ASPECT,
    width: '100%',
  },
  goalImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.gray100,
  },
  goalImagePlaceholder: {
    aspectRatio: CARD_IMAGE_ASPECT,
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  goalBody: {
    padding: 12,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  goalDesc: {
    fontSize: 12,
    color: colors.textMutedDark,
    marginBottom: 8,
    lineHeight: 18,
  },
  goalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  goalDate: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
  },
  dragOverlay: {
    position: 'absolute',
    zIndex: 1000,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
