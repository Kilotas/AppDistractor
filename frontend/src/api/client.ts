const BASE_URL = "http://localhost:8000/api/v1";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "Unknown error");
  }

  if (response.status === 204) return null as T;
  return response.json();
}

// ── Types ──────────────────────────────────────────────

export interface Task {
  id: number;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

// ── Tasks ──────────────────────────────────────────────

export const api = {
  tasks: {
    list: () => request<Task[]>("GET", "/tasks/"),
    create: (title: string, description?: string) =>
      request<Task>("POST", "/tasks/", { title, description }),
    delete: (id: number) => request<null>("DELETE", `/tasks/${id}`),
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
};
