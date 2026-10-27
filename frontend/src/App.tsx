import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { api, getToken } from "./api/client";
import { LanguageProvider } from "./i18n";
import LoginPage from "./pages/LoginPage";
import VerifyPage from "./pages/VerifyPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TasksPage from "./pages/TasksPage";
import SessionsPage from "./pages/SessionsPage";
import StatsPage from "./pages/StatsPage";
import InsightsPage from "./pages/InsightsPage";
import ProfilePage from "./pages/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import RoutinesPage from "./pages/RoutinesPage";
import LegalPage from "./pages/LegalPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";

// Токен, для которого уже проверили is_verified — чтобы не дёргать /auth/me на каждом переходе
let verifiedToken: string | null = null;

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = getToken();
  const [status, setStatus] = useState<"checking" | "verified" | "unverified">(
    token && token === verifiedToken ? "verified" : "checking",
  );

  useEffect(() => {
    if (!token || status !== "checking") return;
    api.auth.me()
      .then((user) => {
        // !== false: старый бэкенд без поля is_verified не должен запирать всех
        if (user.is_verified !== false) { verifiedToken = token; setStatus("verified"); }
        else setStatus("unverified");
      })
      // Сеть/сервер упали — не блокируем UI, страницы сами покажут ошибку
      .catch(() => setStatus("verified"));
  }, [token, status]);

  if (!token) return <Navigate to="/login" replace />;
  if (status === "unverified") return <Navigate to="/verify-email" replace />;
  if (status === "checking") return null;
  return <>{children}</>;
}

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<LegalPage kind="privacy" />} />
        <Route path="/terms" element={<LegalPage kind="terms" />} />
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<RequireAuth><TasksPage /></RequireAuth>} />
        <Route path="/tasks/:taskId/sessions" element={<RequireAuth><SessionsPage /></RequireAuth>} />
        <Route path="/sessions/:sessionId/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
        <Route path="/tasks/:taskId/insights" element={<RequireAuth><InsightsPage /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
        <Route path="/routines" element={<RequireAuth><RoutinesPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  );
}
