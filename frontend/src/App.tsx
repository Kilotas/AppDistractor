import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api/client";
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

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
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
