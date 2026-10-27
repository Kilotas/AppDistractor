import { getTasks, getTask, getWhitelist, startSession, stopSession, logBlockedEvent } from "./api.js";

// ID правила блокировки "всего" — константа чтобы всегда знать какое правило удалять
const BLOCK_ALL_RULE_ID = 1;
// Правила whitelist начинаются с ID 100 (оставляем зазор)
const WHITELIST_RULE_ID_START = 100;
// Правила blacklist — с ID 1000, чтобы не пересекаться с whitelist
const BLACKLIST_RULE_ID_START = 1000;

// ── Установка / обновление extension ──────────────────
chrome.runtime.onInstalled.addListener(() => {
  console.log("Focus App installed");
});

// ── Сообщения от popup ────────────────────────────────
// Popup не может напрямую вызвать API — он шлёт сообщение сюда,
// service worker выполняет и возвращает результат.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((err) => {
    sendResponse({ error: err.message });
  });
  return true; // говорим Chrome что ответ будет асинхронным
});

async function handleMessage(message, sender) {
  switch (message.type) {
    case "GET_TASKS":
      return getTasks();

    case "GET_STATE":
      return getState();

    case "START_SESSION": {
      const session = await startSession(message.taskId);
      const [task, whitelist] = await Promise.all([
        getTask(message.taskId),
        getWhitelist(message.taskId),
      ]);
      await enableBlocking(session, whitelist, task.block_mode ?? "whitelist");
      return session;
    }

    case "STOP_SESSION": {
      const state = await getState();
      if (!state.session) throw new Error("Нет активной сессии");
      try {
        const session = await stopSession(state.session.id);
        await disableBlocking();
        return session;
      } catch (err) {
        // Сессия уже удалена или не найдена — чистим storage и снимаем блокировку
        if (err.message.includes("not found") || err.message.includes("404")) {
          await disableBlocking();
          return { focus_score: 0, blocked_attempts: 0, started_at: null, ended_at: null };
        }
        throw err;
      }
    }

    case "BLOCKED_PAGE_OPENED":
      return logBlockedPage(sender);

    default:
      throw new Error(`Unknown message type: ${message.type}`);
  }
}

// ── Блокировка ────────────────────────────────────────

function toAsciiDomain(domain) {
  try {
    return new URL("http://" + domain).hostname;
  } catch {
    return domain;
  }
}

// Редирект на нашу страницу. regexSubstitution передаёт оригинальный URL
// как ?url=... параметр — так blocked.html знает что пытался открыть пользователь.
const REDIRECT_TO_BLOCKED = {
  type: "redirect",
  redirect: {
    regexSubstitution: chrome.runtime.getURL("/blocked/blocked.html") + "?url=\\0",
  },
};

// Blacklist: блокируем только перечисленные домены (поддомены тоже —
// requestDomains их покрывает), всё остальное открывается свободно.
function buildBlacklistRules(entries) {
  return entries.map((entry, index) => ({
    id: BLACKLIST_RULE_ID_START + index,
    priority: 1,
    action: REDIRECT_TO_BLOCKED,
    condition: {
      regexFilter: ".*",
      requestDomains: [toAsciiDomain(entry.domain)],
      resourceTypes: ["main_frame"],
    },
  }));
}

async function enableBlocking(session, entries, blockMode = "whitelist") {
  // Сохраняем сессию в storage — переживёт "сон" service worker'а
  await chrome.storage.local.set({
    session: { id: session.id, taskId: session.task_id },
    whitelist: entries.map((e) => e.domain),
    blockMode,
  });

  const rulesToAdd = blockMode === "blacklist" ? buildBlacklistRules(entries) : [
    // Правило 1: блокировать всё и редиректить на нашу страницу
    {
      id: BLOCK_ALL_RULE_ID,
      priority: 1,
      action: REDIRECT_TO_BLOCKED,
      condition: {
        regexFilter: ".*",
        resourceTypes: ["main_frame"],
      },
    },

    // Правила 2+: разрешить каждый домен из whitelist
    ...entries.map((entry, index) => ({
      id: WHITELIST_RULE_ID_START + index,
      priority: 2, // выше чем BLOCK_ALL → перебивает блокировку
      action: { type: "allow" },
      condition: {
        requestDomains: [toAsciiDomain(entry.domain)],
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
    `Blocking enabled. Session ${session.id}, ${blockMode}: ${entries.map((e) => e.domain).join(", ") || "empty"}`
  );
}

async function disableBlocking() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map((r) => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: [],
  });

  await chrome.storage.local.remove(["session", "whitelist", "blockMode"]);

  console.log("Blocking disabled");
}

// ── Логирование блокировок ────────────────────────────
// declarativeNetRequest блокирует запросы до того как они уходят,
// но не даёт колбэк "что было заблокировано". Поэтому blocked.html при
// открытии шлёт BLOCKED_PAGE_OPENED — это и есть сигнал о блокировке.
// URL берём из sender.url (его подставляет Chrome), а не из тела сообщения,
// и без разрешения "tabs".
async function logBlockedPage(sender) {
  if (sender.id !== chrome.runtime.id) return;
  if (!sender.url?.startsWith(chrome.runtime.getURL("/blocked/blocked.html"))) return;

  const state = await getState();
  if (!state.session) return;

  // Достаём оригинальный URL из query-параметра (blocked.html?url=...)
  const blockedUrl = new URL(sender.url).searchParams.get("url");
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
}

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
