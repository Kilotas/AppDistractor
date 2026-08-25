import { login, register } from "../api.js";
import { playStart, playBreak, playResume, playComplete } from "../sounds.js";

// ── i18n ───────────────────────────────────────────────
let currentLang = "ru";

const MESSAGES = {
  ru: {
    tabLogin: "Войти", tabRegister: "Регистрация",
    placeholderPassword: "Пароль", placeholderConfirm: "Подтвердите пароль",
    authHint: "Мин. 8 символов, заглавная и строчная буква, цифра",
    btnLogin: "Войти", btnRegister: "Зарегистрироваться",
    chooseTask: "Выбери задачу:", loading: "— загрузка —",
    pomoLabel: "Помодоро", labelFocus: "Фокус", labelBreak: "Перерыв",
    labelLong: "Длинный", labelMin: "мин",
    soundsLabel: "Звуки", soundsHint: "при смене фаз и завершении",
    btnStart: "Начать сессию", manageTasks: "Управление задачами →", btnLogout: "Выйти",
    phaseActive: "● В ФОКУСЕ", phaseFocus: "● ФОКУС", phaseBreak: "● ПЕРЕРЫВ",
    labelBlocks: "блокировок", labelPomos: "помидоров",
    btnStop: "Завершить", btnForceStop: "Принудительно завершить →",
    resultTitle: "Сессия завершена", resultDuration: "Длительность:",
    resultBlocked: "Блокировок:", resultPomos: "Помидоров:", btnNewSession: "Новая сессия",
    notifyFocusTitle: "🚀 Время работать!", notifyFocusMsg: "Перерыв закончился. Вперёд!",
    notifyBreakTitle: "☕ Перерыв!", notifyBreakMsg: "5 минут. Встань, разомнись.",
    notifyLongTitle: "🎉 Длинный перерыв!", notifyLongMsg: "15 минут отдыха — ты заслужил.",
    errFillFields: "Заполни email и пароль", errPwdMismatch: "Пароли не совпадают",
    errPwdMin: "Минимум 8 символов", errPwdUpper: "Нужна заглавная буква",
    errPwdLower: "Нужна строчная буква", errPwdDigit: "Нужна цифра",
    errNoTasks: "Нет активных задач", errLoadTasks: "Не удалось загрузить задачи:",
    taskFallback: "Задача #", pomoHint: (f, b) => `${f} мин фокус · ${b} мин перерыв`,
  },
  en: {
    tabLogin: "Login", tabRegister: "Register",
    placeholderPassword: "Password", placeholderConfirm: "Confirm password",
    authHint: "Min. 8 chars, uppercase, lowercase, digit",
    btnLogin: "Login", btnRegister: "Create account",
    chooseTask: "Choose a task:", loading: "— loading —",
    pomoLabel: "Pomodoro", labelFocus: "Focus", labelBreak: "Break",
    labelLong: "Long", labelMin: "min",
    soundsLabel: "Sounds", soundsHint: "on phase change and finish",
    btnStart: "Start session", manageTasks: "Manage tasks →", btnLogout: "Logout",
    phaseActive: "● FOCUSING", phaseFocus: "● FOCUS", phaseBreak: "● BREAK",
    labelBlocks: "blocks", labelPomos: "pomodoros",
    btnStop: "Finish", btnForceStop: "Force stop →",
    resultTitle: "Session complete", resultDuration: "Duration:",
    resultBlocked: "Blocks:", resultPomos: "Pomodoros:", btnNewSession: "New session",
    notifyFocusTitle: "🚀 Back to work!", notifyFocusMsg: "Break is over. Let's go!",
    notifyBreakTitle: "☕ Break time!", notifyBreakMsg: "5 minutes. Stand up, stretch.",
    notifyLongTitle: "🎉 Long break!", notifyLongMsg: "15 minutes — you earned it.",
    errFillFields: "Please fill in email and password", errPwdMismatch: "Passwords do not match",
    errPwdMin: "At least 8 characters", errPwdUpper: "Uppercase letter required",
    errPwdLower: "Lowercase letter required", errPwdDigit: "Digit required",
    errNoTasks: "No active tasks", errLoadTasks: "Failed to load tasks:",
    taskFallback: "Task #", pomoHint: (f, b) => `${f} min focus · ${b} min break`,
  },
};

const i18n = (key, ...subs) => {
  const val = MESSAGES[currentLang]?.[key] ?? key;
  return typeof val === "function" ? val(...subs) : val;
};

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = i18n(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    el.placeholder = i18n(el.dataset.i18nPlaceholder);
  });
  // Обновляем кнопку переключателя
  const btn = document.getElementById("btn-lang");
  if (btn) btn.textContent = currentLang === "ru" ? "EN" : "RU";
}

// ── Pomodoro ───────────────────────────────────────────
let POMO = { focus: 25 * 60, break: 5 * 60, longBreak: 15 * 60 };
const RING_C = 314.16; // 2π × r(50)

async function loadPomoSettings() {
  const { pomoSettings } = await chrome.storage.local.get("pomoSettings");
  if (pomoSettings) {
    POMO = {
      focus:     pomoSettings.focus * 60,
      break:     pomoSettings.break * 60,
      longBreak: pomoSettings.longBreak * 60,
    };
  }
  return POMO;
}

async function savePomoSettings(focus, brk, longBreak) {
  POMO = { focus: focus * 60, break: brk * 60, longBreak: longBreak * 60 };
  await chrome.storage.local.set({ pomoSettings: { focus, break: brk, longBreak } });
}

// Активное состояние помодоро (null = выключен)
let pomo = null;

// ── DOM ────────────────────────────────────────────────
const screens = {
  auth:   document.getElementById("screen-auth"),
  idle:   document.getElementById("screen-idle"),
  active: document.getElementById("screen-active"),
  result: document.getElementById("screen-result"),
};

const els = {
  // Auth
  authEmail:     document.getElementById("auth-email"),
  authPassword:  document.getElementById("auth-password"),
  authConfirm:   document.getElementById("auth-confirm"),
  authHint:      document.getElementById("auth-hint"),
  btnAuthSubmit: document.getElementById("btn-auth-submit"),
  authError:     document.getElementById("auth-error"),
  authTabs:      document.querySelectorAll(".auth-tab"),
  // Idle
  taskSelect:    document.getElementById("task-select"),
  btnStart:      document.getElementById("btn-start"),
  btnLogout:     document.getElementById("btn-logout"),
  idleError:     document.getElementById("idle-error"),
  soundsCheck:   document.getElementById("sounds-check"),
  pomoCheck:     document.getElementById("pomo-check"),
  pomoSettings:  document.getElementById("pomo-settings"),
  pomoHint:      document.getElementById("pomo-hint"),
  pomoFocus:     document.getElementById("pomo-focus"),
  pomoBreak:     document.getElementById("pomo-break"),
  pomoLong:      document.getElementById("pomo-long"),
  // Active
  btnStop:       document.getElementById("btn-stop"),
  activeTaskName:document.getElementById("active-task-name"),
  timer:         document.getElementById("timer"),
  blockedCount:  document.getElementById("blocked-count"),
  activeError:   document.getElementById("active-error"),
  btnForceStop:  document.getElementById("btn-force-stop"),
  phaseBadge:    document.getElementById("phase-badge"),
  ringFill:      document.getElementById("ring-fill"),
  pomoDots:      document.getElementById("pomo-dots"),
  statPomo:      document.getElementById("stat-pomo"),
  pomoDone:      document.getElementById("pomo-done"),
  // Result
  btnNew:        document.getElementById("btn-new"),
  resultScore:   document.getElementById("result-score"),
  resultDuration:document.getElementById("result-duration"),
  resultBlocked: document.getElementById("result-blocked"),
  resultPomoRow: document.getElementById("result-pomo-row"),
  resultPomos:   document.getElementById("result-pomos"),
};

// ── Утилиты ────────────────────────────────────────────

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  document.body.classList.toggle("dark", name === "active");
}

function showError(el, msg) { el.textContent = msg; el.classList.remove("hidden"); }
function hideError(el) { el.classList.add("hidden"); }

async function send(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...payload });
  if (response?.error) throw new Error(response.error);
  return response;
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Ring ───────────────────────────────────────────────

function updateRing(progress) {
  // progress 0→1: 0 = пусто, 1 = полное
  els.ringFill.style.strokeDashoffset = RING_C * (1 - Math.max(0, Math.min(1, progress)));
}

function setRingInstant(progress) {
  els.ringFill.style.transition = "none";
  updateRing(progress);
  els.ringFill.getBoundingClientRect(); // force reflow
  els.ringFill.style.transition = "";
}

// ── Pomodoro UI ────────────────────────────────────────

function updatePomoDots() {
  if (!pomo) return;
  const cyclePos = pomo.completed % 4;
  const dots = Array.from({ length: 4 }, (_, i) => i < cyclePos ? "🍅" : "○");
  els.pomoDots.textContent = dots.join(" ");
  els.pomoDone.textContent = pomo.completed;
}

function updatePhaseUI() {
  if (!pomo) return;
  const isFocus = pomo.phase === "focus";
  els.phaseBadge.textContent = isFocus ? i18n("phaseFocus") : i18n("phaseBreak");
  els.phaseBadge.className = isFocus ? "phase-badge" : "phase-badge break";
  els.timer.textContent = formatDuration(pomo.remaining);
  updatePomoDots();
  setRingInstant(pomo.remaining / pomo.phaseTotal);
}

async function savePomo() {
  if (!pomo) return;
  await chrome.storage.local.set({
    pomoState: {
      enabled: true,
      phase: pomo.phase,
      phaseStartedAt: new Date().toISOString(),
      phaseTotal: pomo.phaseTotal,
      completed: pomo.completed,
    }
  });
}

function notify(title, message) {
  chrome.notifications?.create("pomo-" + Date.now(), {
    type: "basic",
    iconUrl: "../icons/icon48.png",
    title,
    message,
  });
}

function handlePhaseEnd() {
  if (pomo.phase === "focus") {
    pomo.completed++;
    const isLong = pomo.completed % 4 === 0;
    pomo.phase = "break";
    pomo.phaseTotal = isLong ? POMO.longBreak : POMO.break;
    pomo.remaining = pomo.phaseTotal;
    notify(isLong ? i18n("notifyLongTitle") : i18n("notifyBreakTitle"), isLong
      ? i18n("notifyLongMsg")
      : i18n("notifyBreakMsg"));
    playBreak();
  } else {
    pomo.phase = "focus";
    pomo.phaseTotal = POMO.focus;
    pomo.remaining = POMO.focus;
    notify(i18n("notifyFocusTitle"), i18n("notifyFocusMsg"));
    playResume();
  }
  updatePhaseUI();
  savePomo();
}

// ── Таймер ─────────────────────────────────────────────
let timerInterval = null;

function startTimer(startedAt) {
  const startMs = new Date(startedAt).getTime();

  // Устанавливаем начальное состояние кольца сразу (без анимации)
  if (pomo) {
    setRingInstant(pomo.remaining / pomo.phaseTotal);
    els.timer.textContent = formatDuration(pomo.remaining);
  } else {
    const elapsed = Math.floor((Date.now() - startMs) / 1000);
    setRingInstant(Math.min(elapsed / (60 * 60), 1));
    els.timer.textContent = formatDuration(elapsed);
  }

  timerInterval = setInterval(() => {
    if (pomo) {
      pomo.remaining = Math.max(0, pomo.remaining - 1);
      els.timer.textContent = formatDuration(pomo.remaining);
      updateRing(pomo.remaining / pomo.phaseTotal);
      if (pomo.remaining === 0) handlePhaseEnd();
    } else {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      els.timer.textContent = formatDuration(elapsed);
      updateRing(Math.min(elapsed / (60 * 60), 1)); // заполняется за 60 мин
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ── Auth ───────────────────────────────────────────────

function validatePassword(password) {
  if (password.length < 8) return i18n("errPwdMin");
  if (!/[A-Z]/.test(password)) return i18n("errPwdUpper");
  if (!/[a-z]/.test(password)) return i18n("errPwdLower");
  if (!/d/.test(password)) return i18n("errPwdDigit");
  return null;
}

let authMode = "login";

els.authTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    authMode = tab.dataset.tab;
    els.authTabs.forEach(t => t.classList.toggle("active", t.dataset.tab === authMode));
    els.btnAuthSubmit.textContent = authMode === "login" ? i18n("btnLogin") : i18n("btnRegister");
    els.authConfirm.classList.toggle("hidden", authMode === "login");
    els.authHint.classList.toggle("hidden", authMode === "login");
    els.authPassword.value = "";
    els.authConfirm.value = "";
    hideError(els.authError);
  });
});

els.btnAuthSubmit.addEventListener("click", async () => {
  const email = els.authEmail.value.trim();
  const password = els.authPassword.value;
  const confirmPassword = els.authConfirm.value;

  if (!email || !password) { showError(els.authError, i18n("errFillFields")); return; }

  if (authMode === "register") {
    const pwdError = validatePassword(password);
    if (pwdError) { showError(els.authError, pwdError); return; }
    if (password !== confirmPassword) { showError(els.authError, i18n("errPwdMismatch")); return; }
  }

  els.btnAuthSubmit.disabled = true;
  hideError(els.authError);

  try {
    let access_token;
    if (authMode === "login") {
      ({ access_token } = await login(email, password));
    } else {
      ({ access_token } = await register(email, password, confirmPassword));
    }
    await chrome.storage.local.set({ authToken: access_token });
    await showIdleScreen();
  } catch (err) {
    showError(els.authError, err.message);
  } finally {
    els.btnAuthSubmit.disabled = false;
  }
});

// ── Idle ───────────────────────────────────────────────

els.soundsCheck.addEventListener("change", () => {
  chrome.storage.local.set({ soundsOn: els.soundsCheck.checked });
});

els.pomoCheck.addEventListener("change", () => {
  const checked = els.pomoCheck.checked;
  chrome.storage.local.set({ pomoEnabled: checked });
  els.pomoSettings.classList.toggle("hidden", !checked);
  updatePomoHint();
});

function updatePomoHint() {
  const f = parseInt(els.pomoFocus.value) || 25;
  const b = parseInt(els.pomoBreak.value) || 5;
  els.pomoHint.textContent = i18n("pomoHint", String(f), String(b));
}

[els.pomoFocus, els.pomoBreak, els.pomoLong].forEach(input => {
  input.addEventListener("change", () => {
    const f = Math.max(1, parseInt(els.pomoFocus.value) || 25);
    const b = Math.max(1, parseInt(els.pomoBreak.value) || 5);
    const l = Math.max(1, parseInt(els.pomoLong.value) || 15);
    els.pomoFocus.value = f;
    els.pomoBreak.value = b;
    els.pomoLong.value = l;
    savePomoSettings(f, b, l);
    updatePomoHint();
  });
});

async function showIdleScreen() {
  showScreen("idle");
  hideError(els.idleError);

  // Восстанавливаем состояние тогглов
  const { pomoEnabled, soundsOn } = await chrome.storage.local.get(["pomoEnabled", "soundsOn"]);
  els.soundsCheck.checked = soundsOn !== false;
  els.pomoCheck.checked = !!pomoEnabled;
  els.pomoSettings.classList.toggle("hidden", !pomoEnabled);

  const settings = await loadPomoSettings();
  els.pomoFocus.value = settings.focus / 60;
  els.pomoBreak.value = settings.break / 60;
  els.pomoLong.value  = settings.longBreak / 60;
  updatePomoHint();

  try {
    const tasks = await send("GET_TASKS");
    els.taskSelect.innerHTML = tasks.length
      ? tasks.map(t => `<option value="${t.id}">${t.title}</option>`).join("")
      : `<option value="">${i18n("errNoTasks")}</option>`;
    els.btnStart.disabled = tasks.length === 0;
  } catch (err) {
    if (err.message.includes("авторизован") || err.message.includes("Сессия истекла")) {
      showScreen("auth");
    } else {
      showError(els.idleError, `${i18n("errLoadTasks")} ${err.message}`);
    }
  }
}

// ── Active ─────────────────────────────────────────────

async function showActiveScreen(sessionData) {
  showScreen("active");
  hideError(els.activeError);

  els.activeTaskName.textContent = sessionData.taskTitle ?? i18n("taskFallback", String(sessionData.taskId));
  els.blockedCount.textContent = sessionData.blockedAttempts ?? 0;

  const pomoEnabled = !!pomo;
  els.statPomo.classList.toggle("hidden", !pomoEnabled);
  els.pomoDots.classList.toggle("hidden", !pomoEnabled);

  if (pomo) {
    updatePhaseUI();
  } else {
    els.phaseBadge.textContent = i18n("phaseActive");
    els.phaseBadge.className = "phase-badge";
  }

  stopTimer();
  startTimer(sessionData.startedAt);
}

// ── Result ─────────────────────────────────────────────

function showResultScreen(session, completedPomos = 0) {
  stopTimer();
  showScreen("result");

  els.resultScore.textContent = Math.round(session.focus_score ?? 0);

  const durationSec = session.ended_at
    ? Math.floor((new Date(session.ended_at) - new Date(session.started_at)) / 1000)
    : 0;
  els.resultDuration.textContent = formatDuration(durationSec);
  els.resultBlocked.textContent = session.blocked_attempts;

  if (completedPomos > 0) {
    els.resultPomoRow.classList.remove("hidden");
    els.resultPomos.textContent = completedPomos;
  } else {
    els.resultPomoRow.classList.add("hidden");
  }
}

// ── Кнопки ────────────────────────────────────────────

els.btnStart.addEventListener("click", async () => {
  const taskId = parseInt(els.taskSelect.value);
  if (!taskId) return;

  els.btnStart.disabled = true;
  hideError(els.idleError);

  try {
    const taskTitle = els.taskSelect.options[els.taskSelect.selectedIndex].text;
    const session = await send("START_SESSION", { taskId });

    await chrome.storage.local.set({
      sessionMeta: { taskTitle, startedAt: session.started_at },
    });

    // Инициализируем помодоро если включён
    if (els.pomoCheck.checked) {
      pomo = { phase: "focus", remaining: POMO.focus, phaseTotal: POMO.focus, completed: 0 };
      await savePomo();
    } else {
      pomo = null;
    }

    playStart();
    await showActiveScreen({
      taskTitle,
      taskId,
      startedAt: session.started_at,
      blockedAttempts: 0,
    });
  } catch (err) {
    els.btnStart.disabled = false;
    showError(els.idleError, err.message);
  }
});

els.btnStop.addEventListener("click", async () => {
  els.btnStop.disabled = true;
  hideError(els.activeError);

  try {
    const completedPomos = pomo ? pomo.completed : 0;
    const session = await send("STOP_SESSION");
    await chrome.storage.local.remove("pomoState");
    pomo = null;
    playComplete();
    showResultScreen(session, completedPomos);
  } catch (err) {
    els.btnStop.disabled = false;
    showError(els.activeError, err.message);
  }
});

els.btnForceStop.addEventListener("click", async () => {
  stopTimer();
  await chrome.storage.local.remove(["session", "whitelist", "sessionMeta", "pomoState"]);
  pomo = null;
  await showIdleScreen();
});

els.btnNew.addEventListener("click", async () => {
  await showIdleScreen();
});

els.btnLogout.addEventListener("click", async () => {
  await chrome.storage.local.remove(["authToken", "session", "whitelist", "sessionMeta", "pomoState"]);
  showScreen("auth");
});

// ── Инициализация ──────────────────────────────────────

async function init() {
  const { extLang } = await chrome.storage.local.get("extLang");
  currentLang = extLang ?? "ru";
  applyI18n();

  document.getElementById("btn-lang")?.addEventListener("click", async () => {
    currentLang = currentLang === "ru" ? "en" : "ru";
    await chrome.storage.local.set({ extLang: currentLang });
    applyI18n();
  });

  const { authToken } = await chrome.storage.local.get("authToken");
  if (!authToken) { showScreen("auth"); return; }

  const state = await send("GET_STATE");
  if (state.session) {
    // Восстанавливаем помодоро если был активен
    const { pomoState } = await chrome.storage.local.get("pomoState");
    if (pomoState?.enabled) {
      const elapsed = Math.floor((Date.now() - new Date(pomoState.phaseStartedAt).getTime()) / 1000);
      const remaining = Math.max(0, pomoState.phaseTotal - elapsed);
      pomo = {
        phase: pomoState.phase,
        remaining,
        phaseTotal: pomoState.phaseTotal,
        completed: pomoState.completed,
      };
    }
    await showActiveScreen(state.session);
  } else {
    await showIdleScreen();
  }
}

init();
