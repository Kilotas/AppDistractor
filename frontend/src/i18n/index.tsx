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

    // TodayWidget
    todaySessions: "сессий сегодня",
    todayMinutes: "мин фокуса",
    todayEmpty: "Сегодня ещё не было сессий — запусти первую",

    // ForgotPasswordPage
    forgotTitle: "Забыли пароль?",
    forgotDesc: "Введите email — мы пришлём ссылку для сброса",
    btnSendReset: "Отправить ссылку",
    forgotSuccess: "Если email зарегистрирован — письмо отправлено",
    backToLogin: "← Назад ко входу",

    // ResetPasswordPage
    resetTitle: "Новый пароль",
    resetDesc: "Придумайте новый пароль для вашего аккаунта",
    placeholderNewPassword: "Новый пароль",
    btnResetPassword: "Сохранить пароль",
    resetSuccess: "Пароль изменён! Теперь можно войти",
    resetTokenMissing: "Ссылка недействительна или устарела",
    resetPasswordReused: "Этот пароль уже использовался. Придумайте новый.",

    // VerifyPage
    verifying: "Подтверждаем email...",
    verifiedTitle: "Email подтверждён!",
    verifiedDesc: "Теперь можно войти в приложение",
    goToTasks: "Перейти к задачам",
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
    btnArchive: "Архив",
    btnRestore: "Восстановить",
    archivedSection: "Архив",
    noArchivedTasks: "Нет архивных задач",
    newSubtask: "Новый пункт",
    addSubtask: "+ Добавить",

    navTasks: "Задачи",

    // DashboardPage
    dashboardTitle: "Дашборд",
    dashboardTotalHours: "часов фокуса",
    dashboardTotalSessions: "сессий всего",
    dashboardAvgSession: "мин средняя сессия",
    dashboardDailyChart: "Фокус по дням (мин)",
    dashboardTopTasks: "Топ задач по времени",
    dashboardNoData: "Нет данных — начни первую сессию",
    dashboardMinutes: "мин",
    dashboardFocusChart: "Фокус-скор по сессиям",

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

    // ProfilePage
    profileTitle: "Профиль",
    profileEmail: "Email",
    profilePlan: "Тариф",
    profilePlanFree: "Free",
    profilePlanPro: "Pro",
    profileTrial: "Триал до",
    profileTrialExpired: "Триал истёк",
    profileMember: "Участник с",
    profileChangePwd: "Сменить пароль",
    profileCurrentPwd: "Текущий пароль",
    profileNewPwd: "Новый пароль",
    profileConfirmPwd: "Подтвердите пароль",
    profileSavePwd: "Сохранить",
    profilePwdSuccess: "Пароль успешно изменён",

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

    // TodayWidget
    todaySessions: "sessions today",
    todayMinutes: "min focused",
    todayEmpty: "No sessions today yet — start your first one",

    // ForgotPasswordPage
    forgotTitle: "Forgot password?",
    forgotDesc: "Enter your email — we'll send a reset link",
    btnSendReset: "Send reset link",
    forgotSuccess: "If the email is registered — check your inbox",
    backToLogin: "← Back to login",

    // ResetPasswordPage
    resetTitle: "New password",
    resetDesc: "Create a new password for your account",
    placeholderNewPassword: "New password",
    btnResetPassword: "Save password",
    resetSuccess: "Password changed! You can now log in",
    resetTokenMissing: "Link is invalid or expired",
    resetPasswordReused: "This password has already been used. Please choose a new one.",

    // VerifyPage
    verifying: "Verifying email...",
    verifiedTitle: "Email verified!",
    verifiedDesc: "You can now use the app",
    goToTasks: "Go to tasks",
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
    btnArchive: "Archive",
    btnRestore: "Restore",
    archivedSection: "Archive",
    noArchivedTasks: "No archived tasks",
    newSubtask: "New item",
    addSubtask: "+ Add",

    navTasks: "Tasks",

    // DashboardPage
    dashboardTitle: "Dashboard",
    dashboardTotalHours: "hours focused",
    dashboardTotalSessions: "total sessions",
    dashboardAvgSession: "min avg session",
    dashboardDailyChart: "Focus by day (min)",
    dashboardTopTasks: "Top tasks by time",
    dashboardNoData: "No data yet — start your first session",
    dashboardMinutes: "min",
    dashboardFocusChart: "Focus score by session",

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

    // ProfilePage
    profileTitle: "Profile",
    profileEmail: "Email",
    profilePlan: "Plan",
    profilePlanFree: "Free",
    profilePlanPro: "Pro",
    profileTrial: "Trial until",
    profileTrialExpired: "Trial expired",
    profileMember: "Member since",
    profileChangePwd: "Change password",
    profileCurrentPwd: "Current password",
    profileNewPwd: "New password",
    profileConfirmPwd: "Confirm password",
    profileSavePwd: "Save",
    profilePwdSuccess: "Password changed successfully",

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
