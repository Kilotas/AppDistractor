const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

// ── Token helpers ──────────────────────────────────────

export const TOKEN_KEY = "focus_token";
export const GUEST_KEY = "focus_guest";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(GUEST_KEY);
}

export function isGuest(): boolean {
  return localStorage.getItem(GUEST_KEY) === "1";
}

export function setGuest(): void {
  localStorage.setItem(GUEST_KEY, "1");
}

// ── HTTP ───────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  authenticated = true,
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (authenticated) {
    const token = getToken();
    if (!token) throw new ApiError("Не авторизован", 401);
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Разлогиниваем только по протухшему токену; 401 на /auth/login и т.п. — обычная ошибка формы
  if (response.status === 401 && authenticated) {
    clearToken();
    window.location.href = "/login";
    throw new ApiError("Сессия истекла", 401);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new ApiError(error.detail ?? "Unknown error", response.status);
  }

  if (response.status === 204) return null as T;
  return response.json();
}

// ── Types ──────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  plan: "free" | "pro";
  is_guest: boolean;
  trial_ends_at: string | null;
  is_verified: boolean;
  created_at: string;
}

export type BlockMode = "whitelist" | "blacklist";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  block_mode: BlockMode;
  created_at: string;
  updated_at: string;
  subtask_count: number;
  completed_count: number;
}

export interface Session {
  id: number;
  task_id: number;
  started_at: string;
  ended_at: string | null;
  status: "active" | "completed" | "cancelled";
  blocked_attempts: number;
  focus_score: number | null;
}

export interface WhitelistEntry {
  id: number;
  task_id: number;
  domain: string;
  label: string | null;
}

export interface TaskInsights {
  task_id: number;
  total_sessions: number;
  avg_focus_score: number | null;
  insights: string[];
  recommendations: string[];
}

export interface SessionStats {
  session_id: number;
  duration_minutes: number | null;
  total_blocked: number;
  blocked_per_minute: Record<string, number>;
  top_domains: { domain: string; count: number }[];
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface StreakStats {
  current_streak: number;
  longest_streak: number;
  total_days_active: number;
  last_active_date: string | null;
}

export interface DailyActivity {
  date: string;
  focus_minutes: number;
  sessions_count: number;
}

export interface DailyStats {
  days: DailyActivity[];
}

export interface TaskFocusStat {
  title: string;
  total_minutes: number;
  sessions_count: number;
}

export interface FocusScorePoint {
  task_title: string;
  focus_score: number;
  ended_at: string;
}

export interface DistractionStats {
  days: number;
  total_attempts: number;
  top_domains: { domain: string; count: number }[];
  /** 24 значения — попытки по часу суток в часовом поясе браузера */
  by_hour: number[];
  peak_hour: number | null;
  typical_session_minute: number | null;
}

export type RoutineType = "morning_brief" | "end_of_day" | "weekly_summary";

export interface Routine {
  id: number;
  type: RoutineType;
  enabled: boolean;
  hour: number;
  timezone_offset: number;
  weekday: number;
}

// ── Auth ───────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string }>(
        "POST",
        "/auth/login",
        { email, password },
        false,
      ),
    register: (email: string, password: string, confirmPassword: string) =>
      request<{ access_token: string; token_type: string }>(
        "POST",
        "/auth/register",
        { email, password, confirm_password: confirmPassword },
        false,
      ),
    verify: (token: string) =>
      request<{ access_token: string; token_type: string }>("POST", `/auth/verify?token=${encodeURIComponent(token)}`, undefined, false),
    resendVerification: (email: string) =>
      request<{ detail: string }>("POST", "/auth/resend-verification", { email }, false),
    me: () => request<User>("GET", "/auth/me"),
    deleteAccount: (password: string | null) =>
      request<null>("DELETE", "/auth/me", { password }),
    guest: () =>
      request<{ access_token: string; token_type: string }>("POST", "/auth/guest", undefined, false),
    forgotPassword: (email: string) =>
      request<{ detail: string }>("POST", "/auth/forgot-password", { email }, false),
    resetPassword: (token: string, new_password: string, confirm_password: string) =>
      request<{ detail: string }>("POST", "/auth/reset-password", { token, new_password, confirm_password }, false),
    changePassword: (current_password: string, new_password: string, confirm_password: string) =>
      request<{ detail: string; access_token: string }>("POST", "/auth/change-password", { current_password, new_password, confirm_password }),
  },

  billing: {
    checkout: () => request<{ url: string }>("POST", "/billing/checkout"),
  },

  tasks: {
    list: () => request<Task[]>("GET", "/tasks/"),
    create: (title: string, description?: string) =>
      request<Task>("POST", "/tasks/", { title, description }),
    delete: (id: number) => request<null>("DELETE", `/tasks/${id}`),
    setActive: (id: number, is_active: boolean) =>
      request<Task>("PATCH", `/tasks/${id}`, { is_active }),
    setBlockMode: (id: number, block_mode: BlockMode) =>
      request<Task>("PATCH", `/tasks/${id}`, { block_mode }),
  },

  whitelist: {
    get: (taskId: number) => request<WhitelistEntry[]>("GET", `/tasks/${taskId}/whitelist`),
    add: (taskId: number, domain: string, label?: string) =>
      request<WhitelistEntry>("POST", `/tasks/${taskId}/whitelist`, { domain, label }),
    remove: (entryId: number) => request<null>("DELETE", `/whitelist/${entryId}`),
  },

  sessions: {
    listForTask: (taskId: number) => request<Session[]>("GET", `/tasks/${taskId}/sessions`),
    stats: (sessionId: number) => request<SessionStats>("GET", `/sessions/${sessionId}/stats`),
  },

  insights: {
    get: (taskId: number) => request<TaskInsights>("GET", `/tasks/${taskId}/insights`),
  },

  stats: {
    streak: () => request<StreakStats>("GET", "/stats/streak"),
    daily: (days = 30) => request<DailyStats>("GET", `/stats/daily?days=${days}`),
    tasks: () => request<{ tasks: TaskFocusStat[] }>("GET", "/stats/tasks"),
    focusScore: () => request<{ points: FocusScorePoint[] }>("GET", "/stats/focus-score"),
    // getTimezoneOffset() считает UTC минус местное время, а бэкенд ждёт наоборот (Москва = 180)
    distractions: (days = 30) =>
      request<DistractionStats>(
        "GET",
        `/stats/distractions?days=${days}&tz_offset_minutes=${-new Date().getTimezoneOffset()}`,
      ),
  },

  activeSessions: {
    list: () => request<Session[]>("GET", "/sessions/active"),
  },

  routines: {
    list: () => request<Routine[]>("GET", "/routines"),
    update: (type: RoutineType, data: Partial<Pick<Routine, "enabled" | "hour" | "timezone_offset" | "weekday">>) =>
      request<Routine>("PATCH", `/routines/${type}`, data),
  },

  subtasks: {
    list: (taskId: number) => request<Subtask[]>("GET", `/tasks/${taskId}/subtasks`),
    create: (taskId: number, title: string) =>
      request<Subtask>("POST", `/tasks/${taskId}/subtasks`, { title }),
    toggle: (taskId: number, subtaskId: number, is_completed: boolean) =>
      request<Subtask>("PATCH", `/tasks/${taskId}/subtasks/${subtaskId}`, { is_completed }),
    rename: (taskId: number, subtaskId: number, title: string) =>
      request<Subtask>("PATCH", `/tasks/${taskId}/subtasks/${subtaskId}`, { title }),
    delete: (taskId: number, subtaskId: number) =>
      request<null>("DELETE", `/tasks/${taskId}/subtasks/${subtaskId}`),
  },
};
