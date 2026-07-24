import { getTasks, getWhitelist, startSession, stopSession, logBlockedEvent } from "./api.js";

// ID правила блокировки "всего" — константа чтобы всегда знать какое правило удалять
const BLOCK_ALL_RULE_ID = 1;
// Правила whitelist начинаются с ID 100 (оставляем зазор)
const WHITELIST_RULE_ID_START = 100;

// ── Установка / обновление extension ──────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log("Focus App installed");
});

// ── Сообщения от popup ────────────────────────────────
// Popup не может напрямую вызвать API — он шлёт сообщение сюда,
// service worker выполняет и возвращает результат.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message });
  });
  return true; // говорим Chrome что ответ будет асинхронным
});

async function handleMessage(message) {
  switch (message.type) {
    case "GET_TASKS":
      return getTasks();

    case "GET_STATE":
      return getState();

    case "START_SESSION": {
      const session = await startSession(message.taskId);
      const whitelist = await getWhitelist(message.taskId);
      await enableBlocking(session, whitelist);
      return session;
    }

    case "STOP_SESSION": {
      const state = await getState();
      if (!state.session) throw new Error("Нет активной сессии");
      const session = await stopSession(state.session.id);
      await disableBlocking();
      return session;
    }

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ── Блокировка ────────────────────────────────────────

async function enableBlocking(session, whitelistEntries) {
  // Сохраняем сессию в storage — переживёт "сон" service worker'а
  await chrome.storage.local.set({
    session: { id: session.id, taskId: session.task_id },
    whitelist: whitelistEntries.map((e) => e.domain),
  });

  const rulesToAdd = [
    // Правило 1: блокировать всё и редиректить на нашу страницу.
    // regexSubstitution передаёт оригинальный URL как ?url=... параметр —
    // так blocked.html знает что именно пытался открыть пользователь.
    {
      id: BLOCK_ALL_RULE_ID,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: chrome.runtime.getURL("/blocked/blocked.html") + "?url=\\0",
        },
      },
      condition: {
        regexFilter: ".*",
        resourceTypes: ["main_frame"],
      },
    },

    // Правила 2+: разрешить каждый домен из whitelist
    ...whitelistEntries.map((entry, index) => ({
      id: WHITELIST_RULE_ID_START + index,
      priority: 2, // выше чем BLOCK_ALL → перебивает блокировку
      action: { type: "allow" },
      condition: {
        requestDomains: [entry.domain],
        resourceTypes: ["main_frame"],
      },
    })),
  ];

  // Сначала чистим старые правила, потом ставим новые
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: rulesToAdd,
  });

  console.log(
    `Blocking enabled. Session ${session.id}, whitelist: ${whitelistEntries.map((e) => e.domain).join(", ") || "empty"}`
  );
}

async function disableBlocking() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: [],
  });

  await chrome.storage.local.remove(["session", "whitelist"]);

  console.log("Blocking disabled");
}

// ── Логирование блокировок ────────────────────────────
// declarativeNetRequest блокирует запросы до того как они уходят,
// но не даёт колбэк "что было заблокировано". Поэтому слушаем
// навигацию на нашу blocked.html — это и есть сигнал о блокировке.
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading") return;
  if (!tab.url?.startsWith(chrome.runtime.getURL("/blocked/blocked.html"))) return;

  const state = await getState();
  if (!state.session) return;

  // Достаём оригинальный URL из query-параметра (blocked.html?url=...)
  const blockedUrl = new URL(tab.url).searchParams.get("url");
  if (!blockedUrl) return;

  try {
    const domain = new URL(blockedUrl).hostname;

    // Дедупликация: игнорируем если тот же URL уже логировался < 5 секунд назад
    const { lastBlocked } = await chrome.storage.local.get("lastBlocked");
    const now = Date.now();
    if (lastBlocked?.url === blockedUrl && now - lastBlocked.at < 5_000) return;
    await chrome.storage.local.set({ lastBlocked: { url: blockedUrl, at: now } });

    // Считаем на какой минуте сессии произошла блокировка
    const startedAt = state.session.startedAt
      ? new Date(state.session.startedAt).getTime()
      : null;
    const sessionMinute = startedAt
      ? Math.floor((now - startedAt) / 60_000)
      : null;

    await logBlockedEvent(state.session.id, blockedUrl, domain, sessionMinute);
  } catch {
    // Не критично если лог не прошёл
  }
});

// ── Хелпер: читаем текущее состояние из storage ───────
async function getState() {
  const data = await chrome.storage.local.get(["session", "whitelist", "sessionMeta"]);
  const session = data.session
    ? { ...data.session, ...(data.sessionMeta ?? {}) }
    : null;
  return {
    session,
    whitelist: data.whitelist ?? [],
  };
}
