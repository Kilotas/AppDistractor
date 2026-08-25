const BASE_URL = "http://localhost:8000/api/v1";

async function getToken() {
  const { authToken } = await chrome.storage.local.get("authToken");
  return authToken ?? null;
}

async function request(method, path, body = null, authenticated = true) {
  const headers = { "Content-Type": "application/json" };

  if (authenticated) {
    const token = await getToken();
    if (!token) throw new Error("Не авторизован");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (response.status === 401) {
    // Токен протух — чистим
    await chrome.storage.local.remove("authToken");
    throw new Error("Сессия истекла, войдите снова");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "Unknown error");
  }

  if (response.status === 204) return null;

  return response.json();
}

// ── Auth ───────────────────────────────────────────────
export async function login(email, password) {
  return request("POST", "/auth/login", { email, password }, false);
}

export async function register(email, password, confirmPassword) {
  return request("POST", "/auth/register", { email, password, confirm_password: confirmPassword }, false);
}

// ── Tasks ─────────────────────────────────────────────
export async function getTasks() {
  return request("GET", "/tasks/active");
}

// ── Whitelist ─────────────────────────────────────────
export async function getWhitelist(taskId) {
  return request("GET", `/tasks/${taskId}/whitelist`);
}

// ── Sessions ──────────────────────────────────────────
export async function startSession(taskId) {
  return request("POST", "/sessions/start", { task_id: taskId });
}

export async function stopSession(sessionId) {
  return request("POST", `/sessions/${sessionId}/stop`);
}

export async function getSession(sessionId) {
  return request("GET", `/sessions/${sessionId}`);
}

// ── Blocked events ────────────────────────────────────
export async function logBlockedEvent(sessionId, url, domain, sessionMinute = null) {
  const now = new Date();
  return request("POST", "/events/", {
    session_id: sessionId,
    url,
    domain,
    attempted_at: now.toISOString(),
    session_minute: sessionMinute,
    source: "extension",
  });
}
