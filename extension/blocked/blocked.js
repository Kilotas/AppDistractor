// Читаем оригинальный URL из query-параметра ?url=...
const params = new URLSearchParams(window.location.search);
const blockedUrl = params.get("url");

if (blockedUrl) {
  document.getElementById("blocked-url").textContent = blockedUrl;
}

// Получаем состояние сессии из background
chrome.runtime.sendMessage({ type: "GET_STATE" }, (state) => {
  if (!state?.session) return;

  // Счётчик блокировок
  document.getElementById("blocked-count").textContent =
    state.session.blockedAttempts ?? "—";

  // Таймер — считаем от started_at
  const startedAt = state.session.startedAt
    ? new Date(state.session.startedAt).getTime()
    : null;

  if (startedAt) {
    function tick() {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
      const s = (elapsed % 60).toString().padStart(2, "0");
      document.getElementById("session-timer").textContent = `${m}:${s}`;
    }
    tick();
    setInterval(tick, 1000);
  }
});
