const BASE_URL = "http://localhost:8000/api/v1";

async function request(method, path, body = null) {
  const options = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail ?? "Unknown error");
  }

  // 204 No Content — тела нет
  if (response.status === 204) return null;

  return response.json();
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
