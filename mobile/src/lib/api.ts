/**
 * GoalMuse API client. Uses EXPO_PUBLIC_API_BASE_URL (default http://localhost:8000).
 * All responses are mapped to camelCase for the app.
 */

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const PREFIX = '/api/v1';

/** Thrown for HTTP errors (statusCode set) or network/connection failures (no statusCode). */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type OnUnauthorized = () => void;
let onUnauthorized: OnUnauthorized | null = null;
export function setOnUnauthorized(fn: OnUnauthorized | null) {
  onUnauthorized = fn;
}

async function request<T>(
  path: string,
  method: string,
  token: string | null,
  body?: object
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network request failed';
    throw new ApiError(msg, undefined, undefined);
  }

  if (res.status === 401 && onUnauthorized) {
    onUnauthorized();
  }

  const text = await res.text();
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const j = JSON.parse(text);
      if (j.detail) detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail);
    } catch {
      if (text) detail = text;
    }
    throw new ApiError(detail, res.status, detail);
  }

  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// --- Response shapes (snake_case from backend) ---
interface UserResponse {
  id: string;
  email: string;
  display_name?: string | null;
  plan?: string;
  notification_preferences?: Record<string, unknown> | null;
}
interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}
interface BoardResponse {
  id: string;
  user_id: string;
  title: string;
  cover_image_uri?: string | null;
  created_at: string;
  updated_at: string;
  goal_count?: number;
}
interface GoalResponse {
  id: string;
  board_id: string;
  title: string;
  description: string;
  target_date: string | null;
  sort_order: number;
  completed?: boolean;
  priority?: string | null;
  image_uri?: string | null;
  created_at: string;
}
interface TaskResponse {
  id: string;
  user_id: string;
  goal_id: string | null;
  title: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}
interface JournalResponse {
  id: string;
  user_id: string;
  content: string;
  goal_ids: string[];
  entry_date?: string | null;
  created_at: string;
}
interface ProgressGoalResponse {
  id: string;
  board_id: string;
  title: string;
  description: string;
  target_date: string | null;
  sort_order: number;
  percent_complete: number;
  completed_tasks: number;
  total_tasks: number;
}
interface ProgressConfidenceResponse {
  confidence_score: number;
  breakdown: { task_completion: number; consistency: number; alignment: number; agent_confidence: number };
  explanation: string;
}
interface InsightsResponse {
  alignment: { score: number; explanation: string };
  synergy: { pairs: { goal_ids: string[]; reason: string }[]; compound_actions: string[]; explanation: string };
  optimization: { action: string; reason: string; goal_id: string | null };
  trace_id?: string | null;  // Opik trace id for linking feedback to this insights run
}

// --- Mappers (snake_case -> camelCase) ---
function mapUser(r: UserResponse) {
  return {
    id: r.id,
    email: r.email,
    displayName: r.display_name ?? r.email?.split('@')[0] ?? 'User',
    plan: r.plan,
    notificationPreferences: r.notification_preferences ?? undefined,
  };
}
function mapBoard(r: BoardResponse, goalIds?: string[]) {
  return {
    id: r.id,
    title: r.title,
    goalIds: goalIds ?? [],
    coverImageUri: r.cover_image_uri ?? undefined,
    goalCount: r.goal_count,
  };
}
function mapGoal(r: GoalResponse) {
  return {
    id: r.id,
    boardId: r.board_id,
    title: r.title,
    description: r.description || undefined,
    targetDate: r.target_date ?? undefined,
    priority: r.priority ?? undefined,
    completed: r.completed ?? false,
    imageUri: r.image_uri ?? undefined,
    sortOrder: r.sort_order,
  };
}
function mapTask(r: TaskResponse) {
  return {
    id: r.id,
    title: r.title,
    completed: r.completed_at != null,
    goalId: r.goal_id ?? undefined,
  };
}
function mapJournal(r: JournalResponse) {
  return {
    id: r.id,
    date: r.entry_date ?? r.created_at?.slice(0, 10) ?? '',
    content: r.content,
    goalId: r.goal_ids?.[0],
  };
}

// --- Auth ---
export const authApi = {
  async login(email: string, password: string) {
    const data = await request<TokenResponse>(`${PREFIX}/auth/login`, 'POST', null, { email, password });
    return { accessToken: data.access_token, user: mapUser(data.user) };
  },
  async register(email: string, password: string, displayName?: string) {
    const data = await request<TokenResponse>(`${PREFIX}/auth/register`, 'POST', null, {
      email,
      password,
      display_name: displayName ?? undefined,
    });
    return { accessToken: data.access_token, user: mapUser(data.user) };
  },
  async me(token: string) {
    const data = await request<UserResponse>(`${PREFIX}/auth/me`, 'GET', token);
    return mapUser(data);
  },
  async updateProfile(token: string, displayName: string, notificationPreferences?: Record<string, unknown>) {
    const data = await request<UserResponse>(`${PREFIX}/auth/me`, 'PATCH', token, {
      display_name: displayName,
      ...(notificationPreferences !== undefined && { notification_preferences: notificationPreferences }),
    });
    return mapUser(data);
  },
  async changePassword(token: string, currentPassword: string, newPassword: string) {
    await request(`${PREFIX}/auth/change-password`, 'POST', token, {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};

// --- Boards ---
export const boardsApi = {
  async list(token: string) {
    const list = await request<BoardResponse[]>(`${PREFIX}/boards`, 'GET', token);
    return list.map((b) => mapBoard(b));
  },
  async get(token: string, boardId: string) {
    const data = await request<{ board: BoardResponse; goals: GoalResponse[] }>(
      `${PREFIX}/boards/${boardId}`,
      'GET',
      token
    );
    const goalIds = data.goals.map((g) => g.id);
    return { board: mapBoard(data.board, goalIds), goals: data.goals.map(mapGoal) };
  },
  async create(token: string, title: string, coverImageUri?: string) {
    const r = await request<BoardResponse>(`${PREFIX}/boards`, 'POST', token, { title });
    return mapBoard(r);
  },
  async update(token: string, boardId: string, updates: { title?: string; coverImageUri?: string }) {
    const r = await request<BoardResponse>(`${PREFIX}/boards/${boardId}`, 'PATCH', token, {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.coverImageUri !== undefined && { cover_image_uri: updates.coverImageUri }),
    });
    return mapBoard(r);
  },
  async delete(token: string, boardId: string) {
    await request(`${PREFIX}/boards/${boardId}`, 'DELETE', token);
  },
};

// --- Goals ---
export const goalsApi = {
  async create(
    token: string,
    boardId: string,
    data: {
      title: string;
      description?: string;
      targetDate?: string;
      sortOrder?: number;
      completed?: boolean;
      priority?: string;
      imageUri?: string;
    }
  ) {
    const r = await request<GoalResponse>(`${PREFIX}/boards/${boardId}/goals`, 'POST', token, {
      title: data.title,
      description: data.description ?? '',
      target_date: data.targetDate ?? null,
      sort_order: data.sortOrder ?? 0,
      completed: data.completed ?? false,
      priority: data.priority ?? null,
      image_uri: data.imageUri ?? null,
    });
    return mapGoal(r);
  },
  async update(
    token: string,
    goalId: string,
    updates: Partial<{
      title: string;
      description: string;
      targetDate: string | null;
      sortOrder: number;
      completed: boolean;
      priority: string | null;
      imageUri: string | null;
    }>
  ) {
    const r = await request<GoalResponse>(`${PREFIX}/goals/${goalId}`, 'PATCH', token, {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.targetDate !== undefined && { target_date: updates.targetDate }),
      ...(updates.sortOrder !== undefined && { sort_order: updates.sortOrder }),
      ...(updates.completed !== undefined && { completed: updates.completed }),
      ...(updates.priority !== undefined && { priority: updates.priority }),
      ...(updates.imageUri !== undefined && { image_uri: updates.imageUri }),
    });
    return mapGoal(r);
  },
  async delete(token: string, goalId: string) {
    await request(`${PREFIX}/goals/${goalId}`, 'DELETE', token);
  },
};

// --- Tasks ---
export const tasksApi = {
  async list(token: string, goalId?: string, completed?: boolean) {
    const params = new URLSearchParams();
    if (goalId) params.set('goal_id', goalId);
    if (completed !== undefined) params.set('completed', String(completed));
    const q = params.toString() ? `?${params.toString()}` : '';
    const list = await request<TaskResponse[]>(`${PREFIX}/entries/tasks${q}`, 'GET', token);
    return list.map(mapTask);
  },
  async create(token: string, title: string, goalId?: string) {
    const r = await request<TaskResponse>(`${PREFIX}/entries/tasks`, 'POST', token, {
      title,
      goal_id: goalId ?? null,
    });
    return mapTask(r);
  },
  async update(token: string, taskId: string, updates: { title?: string; goalId?: string; completed?: boolean }) {
    const r = await request<TaskResponse>(`${PREFIX}/entries/tasks/${taskId}`, 'PATCH', token, {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.goalId !== undefined && { goal_id: updates.goalId }),
      ...(updates.completed !== undefined && { completed: updates.completed }),
    });
    return mapTask(r);
  },
  async delete(token: string, taskId: string) {
    await request(`${PREFIX}/entries/tasks/${taskId}`, 'DELETE', token);
  },
};

// --- Journal ---
export const journalApi = {
  async list(token: string, limit = 50, offset = 0, goalId?: string) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (goalId) params.set('goal_id', goalId);
    const data = await request<{ entries: JournalResponse[]; total: number }>(
      `${PREFIX}/entries/journal?${params.toString()}`,
      'GET',
      token
    );
    return { entries: data.entries.map(mapJournal), total: data.total };
  },
  async create(token: string, content: string, goalIds?: string[], entryDate?: string) {
    const r = await request<JournalResponse>(`${PREFIX}/entries/journal`, 'POST', token, {
      content,
      goal_ids: goalIds ?? [],
      entry_date: entryDate ?? null,
    });
    return mapJournal(r);
  },
};

// --- Progress ---
export const progressApi = {
  async board(token: string, boardId: string) {
    const data = await request<{ board_id: string; goals: ProgressGoalResponse[] }>(
      `${PREFIX}/progress/board/${boardId}`,
      'GET',
      token
    );
    return data;
  },
  async confidence(token: string, boardId?: string) {
    const q = boardId ? `?board_id=${encodeURIComponent(boardId)}` : '';
    return request<ProgressConfidenceResponse>(`${PREFIX}/progress/confidence${q}`, 'GET', token);
  },
};

// --- AI ---
export const aiApi = {
  async insights(token: string, boardId?: string) {
    const q = boardId ? `?board_id=${encodeURIComponent(boardId)}` : '';
    return request<InsightsResponse>(`${PREFIX}/ai/insights${q}`, 'GET', token);
  },
  async feedback(token: string, rating: 'yes' | 'no' | 'somewhat', traceId?: string | null) {
    await request(`${PREFIX}/ai/feedback`, 'POST', token, {
      rating,
      ...(traceId != null && traceId !== '' && { trace_id: traceId }),
    });
  },
};

export { API_BASE };
