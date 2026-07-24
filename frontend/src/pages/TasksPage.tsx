import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { Task, WhitelistEntry } from "../api/client";
import styles from "./TasksPage.module.css";

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

  useEffect(() => {
    loadTasks();
  }, []);

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

  if (loading) return <div className={styles.center}>Загрузка...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Focus App</h1>
      </header>

      {error && <div className={styles.error}>{error}</div>}

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
