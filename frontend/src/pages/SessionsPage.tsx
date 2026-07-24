import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Session } from "../api/client";
import styles from "./SessionsPage.module.css";

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return "В процессе";
  const sec = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}м ${s}с`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className={styles.scorePending}>—</span>;
  const color = score >= 80 ? styles.scoreHigh : score >= 50 ? styles.scoreMid : styles.scoreLow;
  return <span className={`${styles.score} ${color}`}>{Math.round(score)}</span>;
}

export default function SessionsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.sessions.listForTask(Number(taskId))
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className={styles.center}>Загрузка...</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/tasks")}>← Задачи</button>
        <h1 className={styles.title}>История сессий</h1>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.btnInsights}
        onClick={() => navigate(`/tasks/${taskId}/insights`)}
      >
        ✦ AI Анализ
      </button>

      {sessions.length === 0 ? (
        <div className={styles.empty}>Сессий пока нет — запусти первую через расширение</div>
      ) : (
        <div className={styles.list}>
          {[...sessions].reverse().map((session) => (
            <div key={session.id} className={styles.card}>
              <div className={styles.cardLeft}>
                <ScoreBadge score={session.focus_score} />
                <div className={styles.meta}>
                  <div className={styles.date}>{formatDate(session.started_at)}</div>
                  <div className={styles.details}>
                    <span>{formatDuration(session.started_at, session.ended_at)}</span>
                    <span className={styles.dot}>·</span>
                    <span>{session.blocked_attempts} блокировок</span>
                    <span className={styles.dot}>·</span>
                    <span className={`${styles.status} ${styles[session.status]}`}>
                      {session.status === "active" ? "активна" : session.status === "completed" ? "завершена" : "отменена"}
                    </span>
                  </div>
                </div>
              </div>

              {session.status === "completed" && (
                <button
                  className={styles.btnStats}
                  onClick={() => navigate(`/sessions/${session.id}/stats`)}
                >
                  Статистика →
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
