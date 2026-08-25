import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { Session } from "../api/client";
import { useT } from "../i18n";
import styles from "./SessionsPage.module.css";

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className={styles.scorePending}>—</span>;
  const color = score >= 80 ? styles.scoreHigh : score >= 50 ? styles.scoreMid : styles.scoreLow;
  return <span className={`${styles.score} ${color}`}>{Math.round(score)}</span>;
}

export default function SessionsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useT();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.sessions.listForTask(Number(taskId))
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  function formatDuration(startedAt: string, endedAt: string | null): string {
    if (!endedAt) return t("inProgress");
    const sec = Math.floor((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return locale === "ru-RU" ? `${m}м ${s}с` : `${m}m ${s}s`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(locale, {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  function statusLabel(status: Session["status"]): string {
    if (status === "active") return t("statusActive");
    if (status === "completed") return t("statusCompleted");
    return t("statusCancelled");
  }

  if (loading) return <div className={styles.center}>{t("loading")}</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate("/tasks")}>{t("backToTasks")}</button>
        <h1 className={styles.title}>{t("sessionHistory")}</h1>
      </header>

      {error && <div className={styles.error}>{error}</div>}

      <button
        className={styles.btnInsights}
        onClick={() => navigate(`/tasks/${taskId}/insights`)}
      >
        {t("aiAnalysis")}
      </button>

      {sessions.length === 0 ? (
        <div className={styles.empty}>{t("noSessions")}</div>
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
                    <span>{session.blocked_attempts} {t("blocks")}</span>
                    <span className={styles.dot}>·</span>
                    <span className={`${styles.status} ${styles[session.status]}`}>
                      {statusLabel(session.status)}
                    </span>
                  </div>
                </div>
              </div>

              {session.status === "completed" && (
                <button
                  className={styles.btnStats}
                  onClick={() => navigate(`/sessions/${session.id}/stats`)}
                >
                  {t("btnStats")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
