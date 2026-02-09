import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { boardsApi, goalsApi, journalApi, tasksApi } from '../lib/api';
import { useAuth } from './AuthContext';
import type { Board, Goal, Task, JournalEntry } from '../types';

const BOARDS_KEY = '@goalmuse/boards';
const GOALS_KEY = '@goalmuse/goals';
const TASKS_KEY = '@goalmuse/tasks';
const JOURNAL_KEY = '@goalmuse/journal';

interface AppStateContextValue {
  boards: Board[];
  goals: Goal[];
  tasks: Task[];
  journal: JournalEntry[];
  isLoading: boolean;
  addBoard: (title: string) => Promise<string>;
  updateBoard: (id: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addTask: (title: string, goalId?: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addJournalEntry: (content: string, goalId?: string, date?: string) => Promise<void>;
  getGoalsByBoard: (boardId: string) => Goal[];
  getGoalById: (goalId: string) => Goal | undefined;
  getOrderedGoalsByBoard: (boardId: string) => Goal[];
  reorderBoardGoals: (boardId: string, orderedGoalIds: string[]) => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function toBoard(b: { id: string; title: string; goalIds?: string[]; coverImageUri?: string }): Board {
  return {
    id: b.id,
    title: b.title,
    goalIds: b.goalIds ?? [],
    coverImageUri: b.coverImageUri,
  };
}

function toGoal(g: {
  id: string;
  boardId: string;
  title: string;
  description?: string;
  targetDate?: string;
  priority?: string;
  completed?: boolean;
  imageUri?: string;
  sortOrder?: number;
}): Goal {
  return {
    id: g.id,
    boardId: g.boardId,
    title: g.title,
    description: g.description,
    targetDate: g.targetDate,
    priority: g.priority,
    completed: g.completed ?? false,
    imageUri: g.imageUri,
  };
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!token) {
      setBoards([]);
      setGoals([]);
      setTasks([]);
      setJournal([]);
      setIsLoading(false);
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        const boardsList = await boardsApi.list(token);
        const allGoals: Goal[] = [];
        const boardsWithGoals: Board[] = [];

        for (const b of boardsList) {
          const { board, goals: boardGoals } = await boardsApi.get(token, b.id);
          const goalIds = boardGoals.map((g) => g.id);
          boardsWithGoals.push(toBoard({ ...board, goalIds }));
          allGoals.push(...boardGoals.map(toGoal));
        }

        const [tasksList, journalData] = await Promise.all([
          tasksApi.list(token),
          journalApi.list(token, 50, 0),
        ]);

        const tasksMapped = tasksList.map((t) => ({ id: t.id, title: t.title, completed: t.completed, goalId: t.goalId }));
        setBoards(boardsWithGoals);
        setGoals(allGoals);
        setTasks(tasksMapped);
        setJournal(journalData.entries);
        await persist(boardsWithGoals, allGoals, tasksMapped, journalData.entries);
      } catch (_) {
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
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const addBoard = useCallback(
    async (title: string) => {
      if (!token) throw new Error('Not authenticated');
      const b = await boardsApi.create(token, title);
      const newBoard = toBoard({ ...b, goalIds: b.goalIds ?? [] });
      setBoards((prev) => [...prev, newBoard]);
      await persist([...boards, newBoard], goals, tasks, journal);
      return newBoard.id;
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const updateBoard = useCallback(
    async (id: string, updates: Partial<Board>) => {
      if (!token) return;
      await boardsApi.update(token, id, {
        title: updates.title,
        coverImageUri: updates.coverImageUri,
      });
      setBoards((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
      const next = boards.map((b) => (b.id === id ? { ...b, ...updates } : b));
      await persist(next, goals, tasks, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const deleteBoard = useCallback(
    async (id: string) => {
      if (!token) return;
      await boardsApi.delete(token, id);
      const newBoards = boards.filter((b) => b.id !== id);
      const newGoals = goals.filter((g) => g.boardId !== id);
      setBoards(newBoards);
      setGoals(newGoals);
      await persist(newBoards, newGoals, tasks, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const addGoal = useCallback(
    async (goal: Omit<Goal, 'id'>) => {
      if (!token) return;
      const created = await goalsApi.create(token, goal.boardId, {
        title: goal.title,
        description: goal.description,
        targetDate: goal.targetDate,
        completed: goal.completed ?? false,
        priority: goal.priority,
        imageUri: goal.imageUri,
      });
      const newGoal = toGoal(created);
      setGoals((prev) => [...prev, newGoal]);
      setBoards((prev) =>
        prev.map((b) =>
          b.id === goal.boardId ? { ...b, goalIds: [...(b.goalIds || []), created.id] } : b
        )
      );
      const nextBoards = boards.map((b) =>
        b.id === goal.boardId ? { ...b, goalIds: [...(b.goalIds || []), created.id] } : b
      );
      await persist(nextBoards, [...goals, newGoal], tasks, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const updateGoal = useCallback(
    async (id: string, updates: Partial<Goal>) => {
      if (!token) return;
      await goalsApi.update(token, id, {
        title: updates.title,
        description: updates.description,
        targetDate: updates.targetDate,
        completed: updates.completed,
        priority: updates.priority,
        imageUri: updates.imageUri,
        sortOrder: updates.sortOrder,
      });
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
      const next = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
      await persist(boards, next, tasks, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const deleteGoal = useCallback(
    async (id: string) => {
      if (!token) return;
      await goalsApi.delete(token, id);
      const newGoals = goals.filter((g) => g.id !== id);
      const newBoards = boards.map((b) => ({ ...b, goalIds: (b.goalIds || []).filter((gid) => gid !== id) }));
      setGoals(newGoals);
      setBoards(newBoards);
      await persist(newBoards, newGoals, tasks, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const addTask = useCallback(
    async (title: string, goalId?: string) => {
      if (!token) return;
      const created = await tasksApi.create(token, title, goalId);
      const newTask: Task = { id: created.id, title: created.title, completed: created.completed, goalId: created.goalId };
      setTasks((prev) => [...prev, newTask]);
      await persist(boards, goals, [...tasks, newTask], journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      if (!token) return;
      const t = tasks.find((x) => x.id === id);
      if (!t) return;
      await tasksApi.update(token, id, { completed: !t.completed });
      setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x)));
      const next = tasks.map((x) => (x.id === id ? { ...x, completed: !x.completed } : x));
      await persist(boards, goals, next, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!token) return;
      await tasksApi.delete(token, id);
      const newTasks = tasks.filter((t) => t.id !== id);
      setTasks(newTasks);
      await persist(boards, goals, newTasks, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const addJournalEntry = useCallback(
    async (content: string, goalId?: string, date?: string) => {
      if (!token) return;
      const entryDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : new Date().toISOString().slice(0, 10);
      const created = await journalApi.create(token, content, goalId ? [goalId] : [], entryDate);
      const newEntry: JournalEntry = {
        id: created.id,
        date: created.date,
        content: created.content,
        goalId: created.goalId,
      };
      setJournal((prev) => [newEntry, ...prev]);
      await persist(boards, goals, tasks, [newEntry, ...journal]);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  const getGoalsByBoard = useCallback((boardId: string) => goals.filter((g) => g.boardId === boardId), [goals]);

  const getGoalById = useCallback((goalId: string) => goals.find((g) => g.id === goalId), [goals]);

  const getOrderedGoalsByBoard = useCallback(
    (boardId: string) => {
      const board = boards.find((b) => b.id === boardId);
      const byBoard = goals.filter((g) => g.boardId === boardId);
      if (!board?.goalIds?.length) return byBoard;
      const orderMap = new Map(board.goalIds.map((id, i) => [id, i]));
      return byBoard.slice().sort((a, b) => {
        const ai = orderMap.has(a.id) ? orderMap.get(a.id)! : 1e9;
        const bi = orderMap.has(b.id) ? orderMap.get(b.id)! : 1e9;
        return ai - bi;
      });
    },
    [boards, goals]
  );

  const reorderBoardGoals = useCallback(
    async (boardId: string, orderedGoalIds: string[]) => {
      if (!token) return;
      for (let i = 0; i < orderedGoalIds.length; i++) {
        await goalsApi.update(token, orderedGoalIds[i], { sortOrder: i });
      }
      setBoards((prev) => prev.map((b) => (b.id === boardId ? { ...b, goalIds: orderedGoalIds } : b)));
      const nextBoards = boards.map((b) => (b.id === boardId ? { ...b, goalIds: orderedGoalIds } : b));
      await persist(nextBoards, goals, tasks, journal);
    },
    [token, boards, goals, tasks, journal, persist]
  );

  return (
    <AppStateContext.Provider
      value={{
        boards,
        goals,
        tasks,
        journal,
        isLoading,
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
