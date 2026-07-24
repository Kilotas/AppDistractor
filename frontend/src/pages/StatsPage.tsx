import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { api } from "../api/client";
import type { SessionStats } from "../api/client";
import styles from "./StatsPage.module.css";

export default function StatsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.sessions.stats(Number(sessionId))
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <div className={styles.center}>Загрузка...</div>;
  if (error) return <div className={styles.center + " " + styles.error}>{error}</div>;
  if (!stats) return null;

  // Готовим данные для графика — сортируем по минуте
  const chartData = Object.entries(stats.blocked_per_minute)
    .map(([minute, count]) => ({ minute: Number(minute), count }))
    .sort((a, b) => a.minute - b.minute);

  // Находим пиковую минуту
  const peakMinute = chartData.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { minute: 0, count: 0 }
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>← Назад</button>
        <h1 className={styles.title}>Статистика сессии #{sessionId}</h1>
      </header>

      {/* Карточки с цифрами */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardValue}>{stats.total_blocked}</div>
          <div className={styles.cardLabel}>всего блокировок</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardValue}>
            {stats.duration_minutes !== null ? `${stats.duration_minutes}м` : "—"}
          </div>
          <div className={styles.cardLabel}>длительность</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardValue}>
            {peakMinute.count > 0 ? `${peakMinute.minute}м` : "—"}
          </div>
          <div className={styles.cardLabel}>пик отвлечений</div>
        </div>
      </div>

      {/* График блокировок по минутам */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Блокировки по минутам</div>
        {chartData.length === 0 ? (
          <div className={styles.empty}>Нет данных</div>
        ) : (
          <div className={styles.chart}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="minute"
                  tickFormatter={(v) => `${v}м`}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  formatter={(value) => [`${value} блок.`, "Блокировок"]}
                  labelFormatter={(label) => `Минута ${label}`}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.minute}
                      fill={entry.minute === peakMinute.minute ? "#dc2626" : "#2563eb"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Топ доменов */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Топ заблокированных сайтов</div>
        {stats.top_domains.length === 0 ? (
          <div className={styles.empty}>Нет данных</div>
        ) : (
          <div className={styles.domainList}>
            {stats.top_domains.map((item, i) => {
              const max = stats.top_domains[0].count;
              const pct = Math.round((item.count / max) * 100);
              return (
                <div key={item.domain} className={styles.domainRow}>
                  <span className={styles.domainRank}>{i + 1}</span>
                  <div className={styles.domainInfo}>
                    <div className={styles.domainName}>{item.domain}</div>
                    <div className={styles.bar}>
                      <div className={styles.barFill} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className={styles.domainCount}>{item.count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
