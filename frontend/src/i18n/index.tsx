import { createContext, useContext, useState, useCallback, useEffect } from "react";

export type Lang = "ru" | "en";
export type Theme = "dark" | "light";

const LANG_KEY = "focus_lang";
const THEME_KEY = "focus_theme";

const translations = {
  ru: {
    // Common
    loading: "Загрузка...",
    back: "← Назад",
    noData: "Нет данных",
    error: "Ошибка",
    logout: "Выйти",

    // LoginPage
    loginTagline: "Войди и начни фокусироваться",
    tabLogin: "Войти",
    tabRegister: "Регистрация",
    placeholderEmail: "Email",
    placeholderPassword: "Пароль",
    placeholderConfirmPassword: "Подтвердите пароль",
    passwordHint: "Минимум 8 символов, заглавная и строчная буква, цифра",
    btnLogin: "Войти",
    btnRegister: "Зарегистрироваться",
    btnGuest: "Попробовать без регистрации",
    orDivider: "или",
    checkEmailTitle: "Проверьте почту",
    checkEmailDesc: "Мы отправили ссылку для подтверждения на",
    resendBtn: "Отправить письмо повторно",
    resendSuccess: "Письмо отправлено повторно",
    switchAccount: "Войти с другим аккаунтом",
    pwdMin: "Минимум 8 символов",
    pwdUpper: "Нужна хотя бы одна заглавная буква",
    pwdLower: "Нужна хотя бы одна строчная буква",
    pwdDigit: "Нужна хотя бы одна цифра",
    pwdMismatch: "Пароли не совпадают",

    // VerifyPage
    verifying: "Подтверждаем email...",
    verifiedTitle: "Email подтверждён!",
    verifiedDesc: "Теперь можно войти в приложение",
    goToTasks: "Перейти к задачам",
    backToLogin: "На страницу входа",
    tokenMissing: "Токен отсутствует",

    // TasksPage
    guestMode: "Гостевой режим",
    guestDesc: "Данные не сохранятся после выхода",
    registerNow: "Зарегистрироваться",
    currentStreak: "текущий стрик",
    longestStreak: "лучшая серия",
    totalDays: "всего дней",
    activityTitle: "Активность за 30 дней",
    heatmapLess: "меньше",
    heatmapMore: "больше",
    taskPlaceholder: "Название задачи",
    descPlaceholder: "Описание (необязательно)",
    creating: "Создаю...",
    createTask: "Создать задачу",
    noTasks: "Задач пока нет — создай первую",
    btnChecklist: "Чеклист",
    btnSessions: "Сессии",
    btnDelete: "Удалить",
    newSubtask: "Новый пункт",
    addSubtask: "+ Добавить",

    // SessionsPage
    backToTasks: "← Задачи",
    sessionHistory: "История сессий",
    aiAnalysis: "✦ AI Анализ",
    noSessions: "Сессий пока нет — запусти первую через расширение",
    inProgress: "В процессе",
    blocks: "блокировок",
    statusActive: "активна",
    statusCompleted: "завершена",
    statusCancelled: "отменена",
    btnStats: "Статистика →",

    // StatsPage
    sessionStats: "Статистика сессии",
    totalBlocks: "всего блокировок",
    duration: "длительность",
    peakDistraction: "пик отвлечений",
    blocksByMinute: "Блокировки по минутам",
    topSites: "Топ заблокированных сайтов",
    blockTooltip: "блок.",
    blocksLabel: "Блокировок",
    minuteLabel: "Минута",

    // InsightsPage
    analyzing: "Анализирую...",
    aiTitle: "AI Анализ",
    totalSessions: "сессий всего",
    avgScore: "средний score",
    observations: "Наблюдения",
    recommendations: "Рекомендации",
    proFeature: "Pro-функция",
    proDesc: "AI-инсайты доступны в плане Pro.\nТриал закончился или не активен.",
    btnUpgrade: "Оформить Pro — $4.99/мес",
    checkoutLoading: "Загружаю...",
  },
  en: {
    // Common
    loading: "Loading...",
    back: "← Back",
    noData: "No data",
    error: "Error",
    logout: "Logout",

    // LoginPage
    loginTagline: "Login and start focusing",
    tabLogin: "Login",
    tabRegister: "Register",
    placeholderEmail: "Email",
    placeholderPassword: "Password",
    placeholderConfirmPassword: "Confirm password",
    passwordHint: "At least 8 characters, uppercase, lowercase, digit",
    btnLogin: "Login",
    btnRegister: "Create account",
    btnGuest: "Try without registration",
    orDivider: "or",
    checkEmailTitle: "Check your email",
    checkEmailDesc: "We sent a verification link to",
    resendBtn: "Resend email",
    resendSuccess: "Email resent",
    switchAccount: "Login with another account",
    pwdMin: "At least 8 characters",
    pwdUpper: "At least one uppercase letter required",
    pwdLower: "At least one lowercase letter required",
    pwdDigit: "At least one digit required",
    pwdMismatch: "Passwords do not match",

    // VerifyPage
    verifying: "Verifying email...",
    verifiedTitle: "Email verified!",
    verifiedDesc: "You can now use the app",
    goToTasks: "Go to tasks",
    backToLogin: "Back to login",
    tokenMissing: "Token is missing",

    // TasksPage
    guestMode: "Guest mode",
    guestDesc: "Data will not be saved after logout",
    registerNow: "Register",
    currentStreak: "current streak",
    longestStreak: "best streak",
    totalDays: "total days",
    activityTitle: "Activity for 30 days",
    heatmapLess: "less",
    heatmapMore: "more",
    taskPlaceholder: "Task title",
    descPlaceholder: "Description (optional)",
    creating: "Creating...",
    createTask: "Create task",
    noTasks: "No tasks yet — create your first one",
    btnChecklist: "Checklist",
    btnSessions: "Sessions",
    btnDelete: "Delete",
    newSubtask: "New item",
    addSubtask: "+ Add",

    // SessionsPage
    backToTasks: "← Tasks",
    sessionHistory: "Session history",
    aiAnalysis: "✦ AI Analysis",
    noSessions: "No sessions yet — start one via the extension",
    inProgress: "In progress",
    blocks: "blocks",
    statusActive: "active",
    statusCompleted: "completed",
    statusCancelled: "cancelled",
    btnStats: "Stats →",

    // StatsPage
    sessionStats: "Session stats",
    totalBlocks: "total blocks",
    duration: "duration",
    peakDistraction: "peak distraction",
    blocksByMinute: "Blocks by minute",
    topSites: "Top blocked sites",
    blockTooltip: "block(s)",
    blocksLabel: "Blocks",
    minuteLabel: "Minute",

    // InsightsPage
    analyzing: "Analyzing...",
    aiTitle: "AI Analysis",
    totalSessions: "total sessions",
    avgScore: "avg score",
    observations: "Observations",
    recommendations: "Recommendations",
    proFeature: "Pro feature",
    proDesc: "AI insights are available in the Pro plan.\nTrial ended or not active.",
    btnUpgrade: "Get Pro — $4.99/mo",
    checkoutLoading: "Loading...",
  },
} as const;

type TranslationKey = keyof typeof translations.ru;

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
  locale: string;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(
    () => (localStorage.getItem(LANG_KEY) as Lang) ?? "ru"
  );
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(THEME_KEY) as Theme) ?? "dark"
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setLang = useCallback((l: Lang) => {
    localStorage.setItem(LANG_KEY, l);
    setLangState(l);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    localStorage.setItem(THEME_KEY, t);
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[lang][key],
    [lang]
  );

  const locale = lang === "ru" ? "ru-RU" : "en-US";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, locale, theme, setTheme }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx;
}
