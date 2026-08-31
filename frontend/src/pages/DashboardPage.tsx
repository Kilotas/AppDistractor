import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, LineChart, Line, ReferenceLine,
} from "recharts";
import { api } from "../api/client";
import type { DailyActivity, TaskFocusStat, FocusScorePoint } from "../api/client";
import { useT } from "../i18n";
import AppLayout from "../components/AppLayout";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, locale } = useT();

  const [daily, setDaily] = useState<DailyActivity[]>([]);
  const [topTasks, setTopTasks] = useState<TaskFocusStat[]>([]);
  const [focusHistory, setFocusHistory] = useState<FocusScorePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats.daily(30), api.stats.tasks(), api.stats.focusScore()])
      .then(([d, tt, fs]) => {
        setDaily(d.days);
        setTopTasks(tt.tasks);
        setFocusHistory(fs.points);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalMinutes = daily.reduce((s, d) => s + d.focus_minutes, 0);
  const totalSessions = daily.reduce((s, d) => s + d.sessions_count, 0);
  const avgSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const totalHours = (totalMinutes / 60).toFixed(1);

  const chartData = daily.map((d) => ({
    day: new Date(d.date).toLocaleDateString(locale, { day: "numeric", month: "short" }),
    min: d.focus_minutes,
  }));

  const hasData = totalMinutes > 0;

  if (loading) return <AppLayout><div className={styles.center}>{t("loading")}</div></AppLayout>;

  return (
    <AppLayout>
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("dashboardTitle")}</h1>
      </header>

      {!hasData ? (
        <div className={styles.empty}>{t("dashboardNoData")}</div>
      ) : (
        <>
          {/* Саммари карточки */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{totalHours}</div>
              <div className={styles.summaryLabel}>{t("dashboardTotalHours")}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{totalSessions}</div>
              <div className={styles.summaryLabel}>{t("dashboardTotalSessions")}</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{avgSession}</div>
              <div className={styles.summaryLabel}>{t("dashboardAvgSession")}</div>
            </div>
          </div>

          {/* График по дням */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>{t("dashboardDailyChart")}</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "var(--text-2)", fontSize: 11 }}
                  interval={4}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-2)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: "var(--text)" }}
                  formatter={(v: number) => [`${v} ${t("dashboardMinutes")}`, ""]}
                />
                <Bar dataKey="min" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.min > 0 ? "var(--accent)" : "var(--border)"}
                      fillOpacity={entry.min > 0 ? 0.85 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* График фокус-скора */}
          {focusHistory.length > 1 && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>{t("dashboardFocusChart")}</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={focusHistory.map((p, i) => ({ i: i + 1, score: p.focus_score, task: p.task_title }))}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="i" tick={{ fill: "var(--text-2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={80} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.4} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
                    formatter={(v: number, _: string, props: any) => [`${v}`, props.payload.task]}
                    labelFormatter={(l) => `Сессия ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="var(--accent)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "var(--accent)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Топ задач */}
          {topTasks.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>{t("dashboardTopTasks")}</div>
              <div className={styles.taskBars}>
                {topTasks.map((task) => {
                  const max = topTasks[0].total_minutes;
                  const pct = max > 0 ? (task.total_minutes / max) * 100 : 0;
                  return (
                    <div key={task.title} className={styles.taskBarRow}>
                      <div className={styles.taskBarLabel} title={task.title}>
                        {task.title}
                      </div>
                      <div className={styles.taskBarTrack}>
                        <div className={styles.taskBarFill} style={{ width: `${pct}%` }} />
                      </div>
                      <div className={styles.taskBarValue}>
                        {task.total_minutes} {t("dashboardMinutes")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </AppLayout>
  );
}
