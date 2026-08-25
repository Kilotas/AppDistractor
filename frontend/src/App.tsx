import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getToken } from "./api/client";
import LoginPage from "./pages/LoginPage";
import VerifyPage from "./pages/VerifyPage";
import TasksPage from "./pages/TasksPage";
import SessionsPage from "./pages/SessionsPage";
import StatsPage from "./pages/StatsPage";
import InsightsPage from "./pages/InsightsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<RequireAuth><TasksPage /></RequireAuth>} />
        <Route path="/tasks/:taskId/sessions" element={<RequireAuth><SessionsPage /></RequireAuth>} />
        <Route path="/sessions/:sessionId/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
        <Route path="/tasks/:taskId/insights" element={<RequireAuth><InsightsPage /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  );
}
