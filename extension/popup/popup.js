// Popup живёт только пока открыт. Вся бизнес-логика — в background.js.
// Мы только: рисуем UI, слушаем клики, шлём сообщения в background.

// ── DOM ───────────────────────────────────────────────
const screens = {
  idle: document.getElementById("screen-idle"),
  active: document.getElementById("screen-active"),
  result: document.getElementById("screen-result"),
};

const els = {
  taskSelect: document.getElementById("task-select"),
  btnStart: document.getElementById("btn-start"),
  btnStop: document.getElementById("btn-stop"),
  btnNew: document.getElementById("btn-new"),
  activeTaskName: document.getElementById("active-task-name"),
  timer: document.getElementById("timer"),
  blockedCount: document.getElementById("blocked-count"),
  resultScore: document.getElementById("result-score"),
  resultDuration: document.getElementById("result-duration"),
  resultBlocked: document.getElementById("result-blocked"),
  idleError: document.getElementById("idle-error"),
  activeError: document.getElementById("active-error"),
};

// ── Утилиты ───────────────────────────────────────────

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function showError(el, message) {
  el.textContent = message;
  el.classList.remove("hidden");
}

function hideError(el) {
  el.classList.add("hidden");
}

// Отправить сообщение в background.js и получить ответ
async function send(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...payload });
  if (response?.error) throw new Error(response.error);
  return response;
}

// Форматируем секунды → "04:32"
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── Таймер ────────────────────────────────────────────
let timerInterval = null;
let sessionStartTime = null;

function startTimer(startedAt) {
  sessionStartTime = new Date(startedAt).getTime();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    els.timer.textContent = formatDuration(elapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

// ── Инициализация ─────────────────────────────────────
async function init() {
  const state = await send("GET_STATE");

  if (state.session) {
    // Есть активная сессия — показываем экран active
    await showActiveScreen(state.session);
  } else {
    // Нет сессии — загружаем задачи и показываем idle
    await showIdleScreen();
  }
}

async function showIdleScreen() {
  showScreen("idle");
  hideError(els.idleError);

  try {
    const tasks = await send("GET_TASKS");

    els.taskSelect.innerHTML = tasks.length
      ? tasks.map((t) => `<option value="${t.id}">${t.title}</option>`).join("")
      : `<option value="">Нет активных задач</option>`;

    els.btnStart.disabled = tasks.length === 0;
  } catch (err) {
    showError(els.idleError, `Не удалось загрузить задачи: ${err.message}`);
  }
}

async function showActiveScreen(sessionData) {
  showScreen("active");
  hideError(els.activeError);

  // Имя задачи берём из storage если есть, иначе просто ID
  els.activeTaskName.textContent = sessionData.taskTitle ?? `Задача #${sessionData.taskId}`;
  els.blockedCount.textContent = sessionData.blockedAttempts ?? 0;

  startTimer(sessionData.startedAt);

  // Обновляем счётчик блокировок каждые 5 секунд
  timerInterval && clearInterval(timerInterval);
  startTimer(sessionData.startedAt);
}

function showResultScreen(session) {
  stopTimer();
  showScreen("result");

  const score = session.focus_score ?? 0;
  els.resultScore.textContent = Math.round(score);

  const durationSec = session.ended_at
    ? Math.floor((new Date(session.ended_at) - new Date(session.started_at)) / 1000)
    : 0;
  els.resultDuration.textContent = formatDuration(durationSec);
  els.resultBlocked.textContent = session.blocked_attempts;
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

    // Кладём taskTitle в storage чтобы active-экран мог его показать
    await chrome.storage.local.set({
      sessionMeta: { taskTitle, startedAt: session.started_at },
    });

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
    const session = await send("STOP_SESSION");
    showResultScreen(session);
  } catch (err) {
    els.btnStop.disabled = false;
    showError(els.activeError, err.message);
  }
});

els.btnNew.addEventListener("click", async () => {
  stopTimer();
  await showIdleScreen();
});

// ── Старт ─────────────────────────────────────────────
init();
