import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid, LineChart, Line, ReferenceLine,
} from "recharts";
import { api } from "../api/client";
import type { DailyActivity, TaskFocusStat, FocusScorePoint, DistractionStats } from "../api/client";
import { useT } from "../i18n";
import AppLayout from "../components/AppLayout";
import styles from "./DashboardPage.module.css";

export default function DashboardPage() {
  const { t, locale } = useT();

  const [daily, setDaily] = useState<DailyActivity[]>([]);
  const [topTasks, setTopTasks] = useState<TaskFocusStat[]>([]);
  const [focusHistory, setFocusHistory] = useState<FocusScorePoint[]>([]);
  const [distractions, setDistractions] = useState<DistractionStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.stats.daily(30), api.stats.tasks(), api.stats.focusScore(), api.stats.distractions(30)])
      .then(([d, tt, fs, ds]) => {
        setDaily(d.days);
        setTopTasks(tt.tasks);
        setFocusHistory(fs.points);
        setDistractions(ds);
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

  const hourLabel = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
  const hourData = (distractions?.by_hour ?? []).map((count, hour) => ({ hour, count }));
  const peakHour = distractions?.peak_hour ?? null;

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
                  formatter={(v) => [`${v} ${t("dashboardMinutes")}`, ""]}
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
                    formatter={(v, _, props: any) => [`${v}`, props.payload.task]}
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

          {/* Что отвлекает */}
          {distractions && (
            <div className={styles.card}>
              <div className={styles.cardTitle}>{t("distractTitle")}</div>
              {distractions.total_attempts === 0 ? (
                <div className={styles.distractNone}>{t("distractNone")}</div>
              ) : (
                <>
                  <div className={styles.distractSummary}>
                    <div className={styles.distractCount}>
                      <span className={styles.distractCountValue}>{distractions.total_attempts}</span>
                      <span className={styles.summaryLabel}>{t("distractAttempts")}</span>
                    </div>
                    <div className={styles.distractFacts}>
                      {peakHour !== null && (
                        <div>
                          {t("distractPeak")
                            .replace("{from}", hourLabel(peakHour))
                            .replace("{to}", hourLabel(peakHour + 1))}
                        </div>
                      )}
                      {distractions.typical_session_minute !== null && (
                        <div>{t("distractMinute").replace("{n}", String(distractions.typical_session_minute))}</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.distractGrid}>
                    <div>
                      <div className={styles.distractSubtitle}>{t("distractTopSites")}</div>
                      <div className={styles.taskBars}>
                        {distractions.top_domains.map((d) => {
                          const pct = (d.count / distractions.top_domains[0].count) * 100;
                          return (
                            <div key={d.domain} className={styles.taskBarRow}>
                              <div className={styles.taskBarLabel} title={d.domain}>{d.domain}</div>
                              <div className={styles.taskBarTrack}>
                                <div className={styles.distractBarFill} style={{ width: `${pct}%` }} />
                              </div>
                              <div className={styles.taskBarValue}>{d.count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className={styles.distractSubtitle}>{t("distractByHour")}</div>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={hourData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                          <XAxis
                            dataKey="hour"
                            tick={{ fill: "var(--text-2)", fontSize: 11 }}
                            ticks={[0, 6, 12, 18]}
                            tickFormatter={hourLabel}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis allowDecimals={false} tick={{ fill: "var(--text-2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}
                            labelStyle={{ color: "var(--text)" }}
                            labelFormatter={(h) => `${hourLabel(Number(h))}–${hourLabel(Number(h) + 1)}`}
                            formatter={(v) => [String(v), ""]}
                          />
                          <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                            {hourData.map((entry) => (
                              <Cell
                                key={entry.hour}
                                fill={entry.hour === peakHour ? "var(--warning)" : "var(--text-2)"}
                                fillOpacity={entry.hour === peakHour ? 0.9 : 0.35}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
    </AppLayout>
  );
}
