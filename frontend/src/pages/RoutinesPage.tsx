import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearToken } from "../api/client";
import type { Routine, RoutineType } from "../api/client";
import AppLayout from "../components/AppLayout";
import styles from "./RoutinesPage.module.css";

const ROUTINE_META: Record<RoutineType, { label: string; description: string; icon: string }> = {
  morning_brief: {
    label: "Утренний брифинг",
    description: "Задачи на день и статус стрика",
    icon: "☀️",
  },
  end_of_day: {
    label: "Итоги дня",
    description: "Время в фокусе и количество сессий",
    icon: "🌙",
  },
  weekly_summary: {
    label: "Итоги недели",
    description: "Статистика за 7 дней и топ задачи",
    icon: "📊",
  },
};

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function RoutinesPage() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<RoutineType | null>(null);

  useEffect(() => {
    api.routines.list()
      .then(setRoutines)
      .catch(() => { clearToken(); navigate("/login"); })
      .finally(() => setLoading(false));
  }, []);

  async function handleToggle(routine: Routine) {
    setSaving(routine.type);
    try {
      const updated = await api.routines.update(routine.type, { enabled: !routine.enabled });
      setRoutines(prev => prev.map(r => r.type === routine.type ? updated : r));
    } finally {
      setSaving(null);
    }
  }

  async function handleHour(routine: Routine, hour: number) {
    setSaving(routine.type);
    try {
      const updated = await api.routines.update(routine.type, { hour });
      setRoutines(prev => prev.map(r => r.type === routine.type ? updated : r));
    } finally {
      setSaving(null);
    }
  }

  async function handleWeekday(routine: Routine, weekday: number) {
    setSaving(routine.type);
    try {
      const updated = await api.routines.update(routine.type, { weekday });
      setRoutines(prev => prev.map(r => r.type === routine.type ? updated : r));
    } finally {
      setSaving(null);
    }
  }

  const order: RoutineType[] = ["morning_brief", "end_of_day", "weekly_summary"];
  const sorted = order.map(t => routines.find(r => r.type === t)).filter(Boolean) as Routine[];

  return (
    <AppLayout>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>Рутины</h1>
          <p className={styles.subtitle}>Автоматические email-дайджесты по расписанию</p>
        </header>

        {loading ? (
          <div className={styles.center}>Загрузка...</div>
        ) : (
          <div className={styles.list}>
            {sorted.map(routine => {
              const meta = ROUTINE_META[routine.type];
              const isSaving = saving === routine.type;

              return (
                <div
                  key={routine.type}
                  className={`${styles.card} ${routine.enabled ? styles.cardActive : ""}`}
                >
                  <div className={styles.cardTop}>
                    <div className={styles.cardLeft}>
                      <span className={styles.icon}>{meta.icon}</span>
                      <div>
                        <div className={styles.cardLabel}>{meta.label}</div>
                        <div className={styles.cardDesc}>{meta.description}</div>
                      </div>
                    </div>
                    <button
                      className={`${styles.toggle} ${routine.enabled ? styles.toggleOn : ""}`}
                      onClick={() => handleToggle(routine)}
                      disabled={isSaving}
                      aria-label={routine.enabled ? "Выключить" : "Включить"}
                    >
                      <span className={styles.toggleKnob} />
                    </button>
                  </div>

                  {routine.enabled && (
                    <div className={styles.settings}>
                      <div className={styles.settingRow}>
                        <span className={styles.settingLabel}>Время отправки</span>
                        <select
                          className={styles.select}
                          value={routine.hour}
                          onChange={e => handleHour(routine, Number(e.target.value))}
                          disabled={isSaving}
                        >
                          {HOURS.map(h => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, "0")}:00
                            </option>
                          ))}
                        </select>
                      </div>

                      {routine.type === "weekly_summary" && (
                        <div className={styles.settingRow}>
                          <span className={styles.settingLabel}>День недели</span>
                          <div className={styles.weekdayPicker}>
                            {WEEKDAYS.map((day, i) => (
                              <button
                                key={i}
                                className={`${styles.dayBtn} ${routine.weekday === i ? styles.dayBtnActive : ""}`}
                                onClick={() => handleWeekday(routine, i)}
                                disabled={isSaving}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
