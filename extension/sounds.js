// ── Web Audio звуки для FocusVoid ─────────────────────
// Генерируем тоны программно — никаких файлов не нужно.

let _ctx = null;

function ctx() {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === "suspended") _ctx.resume();
  return _ctx;
}

// Воспроизводит один тон: freq Гц, длительность сек, громкость 0-1, форма волны
function tone(freq, duration, volume = 0.3, type = "sine", startAt = 0) {
  const ac = ctx();
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + startAt);

  // Плавное нарастание и затухание — убирает щелчки
  const start = ac.currentTime + startAt;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// ── Проверка: включены ли звуки ───────────────────────

export async function soundsEnabled() {
  const { soundsOn } = await chrome.storage.local.get("soundsOn");
  return soundsOn !== false; // по умолчанию включены
}

// ── Пресеты ───────────────────────────────────────────

// Старт сессии: восходящий аккорд C–E–G
export async function playStart() {
  if (!await soundsEnabled()) return;
  tone(261.6, 0.25, 0.25, "sine", 0.00); // C4
  tone(329.6, 0.25, 0.25, "sine", 0.10); // E4
  tone(392.0, 0.35, 0.30, "sine", 0.20); // G4
}

// Начало перерыва: мягкий нисходящий тон
export async function playBreak() {
  if (!await soundsEnabled()) return;
  tone(523.3, 0.20, 0.20, "sine", 0.00); // C5
  tone(440.0, 0.30, 0.20, "sine", 0.10); // A4
  tone(349.2, 0.50, 0.18, "sine", 0.22); // F4
}

// Конец перерыва / возврат в фокус: бодрый двойной бип
export async function playResume() {
  if (!await soundsEnabled()) return;
  tone(440.0, 0.12, 0.25, "square", 0.00);
  tone(523.3, 0.20, 0.25, "square", 0.15);
}

// Завершение сессии: финальный 4-нотный аккорд
export async function playComplete() {
  if (!await soundsEnabled()) return;
  tone(261.6, 0.20, 0.20, "sine", 0.00); // C4
  tone(329.6, 0.20, 0.20, "sine", 0.10); // E4
  tone(392.0, 0.20, 0.22, "sine", 0.20); // G4
  tone(523.3, 0.60, 0.25, "sine", 0.30); // C5
}
