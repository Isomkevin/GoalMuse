import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Board, Goal, Task, JournalEntry } from '../types';

const BOARDS_KEY = '@goalmuse/boards';
const GOALS_KEY = '@goalmuse/goals';
const TASKS_KEY = '@goalmuse/tasks';
const JOURNAL_KEY = '@goalmuse/journal';

const defaultBoards: Board[] = [{ id: 'b1', title: '2025 Resolutions', goalIds: ['g1', 'g2', 'g3', 'g4'] }];
const defaultGoals: Goal[] = [
  {
    id: 'g1',
    boardId: 'b1',
    title: 'Launch Visionary Portfolio',
    description: 'Complete all case studies and finalize the personal branding guide for the Q4 launch.',
    targetDate: '2025-12-31',
    priority: 'High Priority',
    completed: false,
  },
  {
    id: 'g2',
    boardId: 'b1',
    title: 'Master Mindfulness',
    description: 'Complete 30 consecutive days of morning meditation and evening journaling sessions.',
    targetDate: '2025-11-15',
    priority: 'Wellness',
    completed: false,
  },
  {
    id: 'g3',
    boardId: 'b1',
    title: 'Quarterly Financial Review',
    description: 'Analyze spending patterns and adjust the automated savings plan for the upcoming Q4 period.',
    targetDate: '2025-10-30',
    priority: 'Finance',
    completed: false,
  },
  {
    id: 'g4',
    boardId: 'b1',
    title: 'Morning Yoga Routine',
    priority: 'Wellness',
    completed: true,
  },
];
const defaultTasks: Task[] = [];
const defaultJournal: JournalEntry[] = [];

interface AppStateContextValue {
  boards: Board[];
  goals: Goal[];
  tasks: Task[];
  journal: JournalEntry[];
  addBoard: (title: string) => string;
  updateBoard: (id: string, updates: Partial<Board>) => void;
  deleteBoard: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addTask: (title: string, goalId?: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  addJournalEntry: (content: string, goalId?: string) => void;
  getGoalsByBoard: (boardId: string) => Goal[];
  getGoalById: (goalId: string) => Goal | undefined;
  getOrderedGoalsByBoard: (boardId: string) => Goal[];
  reorderBoardGoals: (boardId: string, orderedGoalIds: string[]) => void;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [boards, setBoards] = useState<Board[]>(defaultBoards);
  const [goals, setGoals] = useState<Goal[]>(defaultGoals);
  const [tasks, setTasks] = useState<Task[]>(defaultTasks);
  const [journal, setJournal] = useState<JournalEntry[]>(defaultJournal);

  useEffect(() => {
    (async () => {
      try {
        const [b, g, t, j] = await Promise.all([
          AsyncStorage.getItem(BOARDS_KEY),
          AsyncStorage.getItem(GOALS_KEY),
          AsyncStorage.getItem(TASKS_KEY),
          AsyncStorage.getItem(JOURNAL_KEY),
        ]);
        if (b) setBoards(JSON.parse(b));
        if (g) setGoals(JSON.parse(g));
        if (t) setTasks(JSON.parse(t));
        if (j) setJournal(JSON.parse(j));
      } catch (_) {}
    })();
  }, []);

  const persist = useCallback(
    async (newBoards: Board[], newGoals: Goal[], newTasks: Task[], newJournal: JournalEntry[]) => {
      try {
        await Promise.all([
          AsyncStorage.setItem(BOARDS_KEY, JSON.stringify(newBoards)),
          AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals)),
          AsyncStorage.setItem(TASKS_KEY, JSON.stringify(newTasks)),
          AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(newJournal)),
        ]);
      } catch (_) {}
    },
    []
  );

  const addBoard = useCallback(
    (title: string) => {
      const id = 'b' + Date.now();
      const newBoards = [...boards, { id, title, goalIds: [] }];
      setBoards(newBoards);
      persist(newBoards, goals, tasks, journal);
      return id;
    },
    [boards, goals, tasks, journal, persist]
  );

  const updateBoard = useCallback(
    (id: string, updates: Partial<Board>) => {
      const newBoards = boards.map((b) => (b.id === id ? { ...b, ...updates } : b));
      setBoards(newBoards);
      persist(newBoards, goals, tasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const deleteBoard = useCallback(
    (id: string) => {
      const newBoards = boards.filter((b) => b.id !== id);
      const newGoals = goals.filter((g) => g.boardId !== id);
      setBoards(newBoards);
      setGoals(newGoals);
      persist(newBoards, newGoals, tasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const addGoal = useCallback(
    (goal: Omit<Goal, 'id'>) => {
      const id = 'g' + Date.now();
      const newGoals = [...goals, { ...goal, id }];
      setGoals(newGoals);
      const board = boards.find((b) => b.id === goal.boardId);
      const newBoards = board
        ? boards.map((b) => (b.id === board.id ? { ...b, goalIds: [...(b.goalIds || []), id] } : b))
        : boards;
      setBoards(newBoards);
      persist(newBoards, newGoals, tasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<Goal>) => {
      const newGoals = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
      setGoals(newGoals);
      persist(boards, newGoals, tasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const newGoals = goals.filter((g) => g.id !== id);
      const newBoards = boards.map((b) => ({ ...b, goalIds: b.goalIds.filter((gid) => gid !== id) }));
      setGoals(newGoals);
      setBoards(newBoards);
      persist(newBoards, newGoals, tasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const addTask = useCallback(
    (title: string, goalId?: string) => {
      const id = 't' + Date.now();
      const newTasks = [...tasks, { id, title, completed: false, goalId }];
      setTasks(newTasks);
      persist(boards, goals, newTasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const toggleTask = useCallback(
    (id: string) => {
      const newTasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      setTasks(newTasks);
      persist(boards, goals, newTasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const newTasks = tasks.filter((t) => t.id !== id);
      setTasks(newTasks);
      persist(boards, goals, newTasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const addJournalEntry = useCallback(
    (content: string, goalId?: string) => {
      const id = 'j' + Date.now();
      const newJournal = [{ id, date: new Date().toISOString().slice(0, 10), content, goalId }, ...journal];
      setJournal(newJournal);
      persist(boards, goals, tasks, newJournal);
    },
    [boards, goals, tasks, journal, persist]
  );

  const getGoalsByBoard = useCallback(
    (boardId: string) => goals.filter((g) => g.boardId === boardId),
    [goals]
  );

  const getGoalById = useCallback(
    (goalId: string) => goals.find((g) => g.id === goalId),
    [goals]
  );

  const getOrderedGoalsByBoard = useCallback(
    (boardId: string) => {
      const board = boards.find((b) => b.id === boardId);
      const byBoard = goals.filter((g) => g.boardId === boardId);
      if (!board?.goalIds?.length) return byBoard;
      const orderMap = new Map(board.goalIds.map((id, i) => [id, i]));
      const ordered = byBoard.slice().sort((a, b) => {
        const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : 1e9;
        const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : 1e9;
        return ai - bi;
      });
      return ordered;
    },
    [boards, goals]
  );

  const reorderBoardGoals = useCallback(
    (boardId: string, orderedGoalIds: string[]) => {
      const newBoards = boards.map((b) =>
        b.id === boardId ? { ...b, goalIds: orderedGoalIds } : b
      );
      setBoards(newBoards);
      persist(newBoards, goals, tasks, journal);
    },
    [boards, goals, tasks, journal, persist]
  );

  return (
    <AppStateContext.Provider
      value={{
        boards,
        goals,
        tasks,
        journal,
        addBoard,
        updateBoard,
        deleteBoard,
        addGoal,
        updateGoal,
        deleteGoal,
        addTask,
        toggleTask,
        deleteTask,
        addJournalEntry,
        getGoalsByBoard,
        getGoalById,
        getOrderedGoalsByBoard,
        reorderBoardGoals,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
