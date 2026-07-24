import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import type { TaskInsights } from "../api/client";
import styles from "./InsightsPage.module.css";

export default function InsightsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [insights, setInsights] = useState<TaskInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.insights.get(Number(taskId))
      .then(setInsights)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (loading) return <div className={styles.center}>Анализирую...</div>;
  if (error) return <div className={`${styles.center} ${styles.error}`}>{error}</div>;
  if (!insights) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Назад</button>
        <h1 className={styles.title}>AI Анализ</h1>
        <span className={styles.stub}>заглушка</span>
      </header>

      {/* Сводка */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardValue}>{insights.total_sessions}</div>
          <div className={styles.cardLabel}>сессий всего</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardValue}>
            {insights.avg_focus_score !== null ? Math.round(insights.avg_focus_score) : "—"}
          </div>
          <div className={styles.cardLabel}>средний score</div>
        </div>
      </div>

      {/* Инсайты */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Наблюдения</div>
        <ul className={styles.list}>
          {insights.insights.map((text, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.bullet}>→</span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      {/* Рекомендации */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Рекомендации</div>
        <ul className={styles.list}>
          {insights.recommendations.map((text, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.bullet}>✦</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
