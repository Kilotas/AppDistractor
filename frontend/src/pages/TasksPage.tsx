import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearToken, isGuest } from "../api/client";
import type { Task, WhitelistEntry, StreakStats, DailyActivity, Subtask } from "../api/client";
import styles from "./TasksPage.module.css";

function heatmapLevel(minutes: number): number {
  if (minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  return 3;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function TasksPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Форма новой задачи
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Whitelist
  const [openWhitelist, setOpenWhitelist] = useState<number | null>(null);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [newLabel, setNewLabel] = useState("");

  // Subtasks
  const [openSubtasks, setOpenSubtasks] = useState<number | null>(null);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");
  const [editingSubtask, setEditingSubtask] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Stats
  const [streak, setStreak] = useState<StreakStats | null>(null);
  const [daily, setDaily] = useState<DailyActivity[]>([]);

  useEffect(() => {
    loadTasks();
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [s, d] = await Promise.all([api.stats.streak(), api.stats.daily(30)]);
      setStreak(s);
      setDaily(d.days);
    } catch {
      // stats are non-critical, ignore errors
    }
  }

  async function loadTasks() {
    try {
      setTasks(await api.tasks.list());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const task = await api.tasks.create(newTitle.trim(), newDesc.trim() || undefined);
      setTasks((prev) => [...prev, task]);
      setNewTitle("");
      setNewDesc("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function deleteTask(id: number) {
    if (!confirm("Удалить задачу?")) return;
    try {
      await api.tasks.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      if (openWhitelist === id) setOpenWhitelist(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleWhitelist(taskId: number) {
    if (openWhitelist === taskId) {
      setOpenWhitelist(null);
      return;
    }
    setOpenWhitelist(taskId);
    setNewDomain("");
    setNewLabel("");
    const entries = await api.whitelist.get(taskId);
    setWhitelist(entries);
  }

  async function addDomain(taskId: number) {
    if (!newDomain.trim()) return;
    try {
      const entry = await api.whitelist.add(taskId, newDomain.trim(), newLabel.trim() || undefined);
      setWhitelist((prev) => [...prev, entry]);
      setNewDomain("");
      setNewLabel("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function removeDomain(entryId: number) {
    try {
      await api.whitelist.remove(entryId);
      setWhitelist((prev) => prev.filter((e) => e.id !== entryId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleSubtasks(taskId: number) {
    if (openSubtasks === taskId) {
      setOpenSubtasks(null);
      return;
    }
    setOpenSubtasks(taskId);
    setNewSubtask("");
    setEditingSubtask(null);
    const items = await api.subtasks.list(taskId);
    setSubtasks(items);
  }

  async function addSubtask(taskId: number) {
    if (!newSubtask.trim()) return;
    try {
      const item = await api.subtasks.create(taskId, newSubtask.trim());
      setSubtasks((prev) => [...prev, item]);
      setNewSubtask("");
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleSubtask(taskId: number, subtaskId: number, current: boolean) {
    try {
      const updated = await api.subtasks.toggle(taskId, subtaskId, !current);
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? updated : s)));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function saveSubtaskTitle(taskId: number, subtaskId: number) {
    if (!editingTitle.trim()) return;
    try {
      const updated = await api.subtasks.rename(taskId, subtaskId, editingTitle.trim());
      setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? updated : s)));
      setEditingSubtask(null);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function deleteSubtask(taskId: number, subtaskId: number) {
    try {
      await api.subtasks.delete(taskId, subtaskId);
      setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId));
    } catch (e: any) {
      setError(e.message);
    }
  }

  if (loading) return <div className={styles.center}>Загрузка...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>FocusVoid</h1>
        <button
          className={styles.logoutBtn}
          onClick={() => { clearToken(); navigate("/login"); }}
        >
          Выйти
        </button>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      {isGuest() && (
        <div style={{
          background: "linear-gradient(135deg, #1e2a4a, #162040)",
          border: "1px solid #2d3f6e",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}>
          <div>
            <span style={{ color: "var(--text)", fontSize: 14, fontWeight: 500 }}>
              Гостевой режим
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: 13, marginLeft: 8 }}>
              Данные не сохранятся после выхода
            </span>
          </div>
          <button
            onClick={() => { clearToken(); navigate("/login"); }}
            style={{
              background: "var(--accent)", color: "#fff", border: "none",
              borderRadius: 7, padding: "6px 14px", fontSize: 13,
              fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            Зарегистрироваться
          </button>
        </div>
      )}

      {/* Streak виджет */}
      {streak && (
        <div className={styles.streakWidget}>
          <div className={styles.streakStat}>
            <div className={styles.streakValue}>🔥 {streak.current_streak}</div>
            <div className={styles.streakLabel}>текущий стрик</div>
          </div>
          <div className={styles.streakDivider} />
          <div className={styles.streakStat}>
            <div className={styles.streakValue}>{streak.longest_streak}</div>
            <div className={styles.streakLabel}>лучшая серия</div>
          </div>
          <div className={styles.streakDivider} />
          <div className={styles.streakStat}>
            <div className={styles.streakValue}>{streak.total_days_active}</div>
            <div className={styles.streakLabel}>всего дней</div>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {daily.length > 0 && (
        <div className={styles.heatmapCard}>
          <div className={styles.heatmapTitle}>Активность за 30 дней</div>
          <div className={styles.heatmapGrid}>
            {daily.map((d) => (
              <div
                key={d.date}
                className={`${styles.heatmapCell} ${styles[`heatmapLevel${heatmapLevel(d.focus_minutes)}`]}`}
                title={`${formatDate(d.date)}: ${d.focus_minutes} мин, ${d.sessions_count} сессий`}
              />
            ))}
          </div>
          <div className={styles.heatmapLegend}>
            <span>меньше</span>
            <div className={`${styles.heatmapCell} ${styles.heatmapLevel0}`} />
            <div className={`${styles.heatmapCell} ${styles.heatmapLevel1}`} />
            <div className={`${styles.heatmapCell} ${styles.heatmapLevel2}`} />
            <div className={`${styles.heatmapCell} ${styles.heatmapLevel3}`} />
            <span>больше</span>
          </div>
        </div>
      )}

      {/* Форма создания задачи */}
      <form className={styles.createForm} onSubmit={createTask}>
        <input
          className={styles.input}
          placeholder="Название задачи"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <input
          className={styles.input}
          placeholder="Описание (необязательно)"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
        />
        <button className={styles.btnPrimary} disabled={creating || !newTitle.trim()}>
          {creating ? "Создаю..." : "Создать задачу"}
        </button>
      </form>

      {/* Список задач */}
      {tasks.length === 0 ? (
        <div className={styles.empty}>Задач пока нет — создай первую</div>
      ) : (
        <div className={styles.taskList}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskTop}>
                <div>
                  <div className={styles.taskTitle}>{task.title}</div>
                  {task.description && (
                    <div className={styles.taskDesc}>{task.description}</div>
                  )}
                </div>
                <div className={styles.taskActions}>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => navigate(`/tasks/${task.id}/sessions`)}
                  >
                    История
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => toggleSubtasks(task.id)}
                  >
                    {openSubtasks === task.id ? "Скрыть" : "Чеклист"}
                  </button>
                  <button
                    className={styles.btnSecondary}
                    onClick={() => toggleWhitelist(task.id)}
                  >
                    {openWhitelist === task.id ? "Скрыть" : "Whitelist"}
                  </button>
                  <button
                    className={styles.btnDanger}
                    onClick={() => deleteTask(task.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Чеклист подзадач */}
              {openSubtasks === task.id && (
                <div className={styles.subtasks}>
                  <div className={styles.subtasksHeader}>
                    <span className={styles.subtasksTitle}>Подзадачи</span>
                    {subtasks.length > 0 && (
                      <span className={styles.subtasksCount}>
                        {subtasks.filter((s) => s.is_completed).length}/{subtasks.length}
                      </span>
                    )}
                  </div>

                  {subtasks.length === 0 ? (
                    <div className={styles.subtasksEmpty}>Нет подзадач — добавь первую</div>
                  ) : (
                    <div className={styles.subtaskList}>
                      {subtasks.map((s) => (
                        <div key={s.id} className={styles.subtaskRow}>
                          <input
                            type="checkbox"
                            className={styles.subtaskCheck}
                            checked={s.is_completed}
                            onChange={() => toggleSubtask(task.id, s.id, s.is_completed)}
                          />
                          {editingSubtask === s.id ? (
                            <input
                              className={styles.subtaskEditInput}
                              value={editingTitle}
                              autoFocus
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={() => saveSubtaskTitle(task.id, s.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveSubtaskTitle(task.id, s.id);
                                if (e.key === "Escape") setEditingSubtask(null);
                              }}
                            />
                          ) : (
                            <span
                              className={`${styles.subtaskTitle} ${s.is_completed ? styles.subtaskDone : ""}`}
                              onDoubleClick={() => {
                                setEditingSubtask(s.id);
                                setEditingTitle(s.title);
                              }}
                            >
                              {s.title}
                            </span>
                          )}
                          <button
                            className={styles.btnRemove}
                            onClick={() => deleteSubtask(task.id, s.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.addSubtask}>
                    <input
                      className={styles.input}
                      placeholder="Новая подзадача..."
                      value={newSubtask}
                      onChange={(e) => setNewSubtask(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addSubtask(task.id)}
                    />
                    <button
                      className={styles.btnPrimary}
                      onClick={() => addSubtask(task.id)}
                      disabled={!newSubtask.trim()}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Whitelist */}
              {openWhitelist === task.id && (
                <div className={styles.whitelist}>
                  <div className={styles.whitelistTitle}>Разрешённые домены</div>

                  {whitelist.length === 0 ? (
                    <div className={styles.whitelistEmpty}>Список пуст — все сайты будут заблокированы</div>
                  ) : (
                    <div className={styles.domainList}>
                      {whitelist.map((entry) => (
                        <div key={entry.id} className={styles.domainRow}>
                          <span className={styles.domain}>{entry.domain}</span>
                          {entry.label && <span className={styles.label}>{entry.label}</span>}
                          <button
                            className={styles.btnRemove}
                            onClick={() => removeDomain(entry.id)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.addDomain}>
                    <input
                      className={styles.input}
                      placeholder="domain.com"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addDomain(task.id)}
                    />
                    <input
                      className={styles.input}
                      placeholder="Подпись (необязательно)"
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addDomain(task.id)}
                    />
                    <button
                      className={styles.btnPrimary}
                      onClick={() => addDomain(task.id)}
                      disabled={!newDomain.trim()}
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
