import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TasksPage from "./pages/TasksPage";
import SessionsPage from "./pages/SessionsPage";
import StatsPage from "./pages/StatsPage";
import InsightsPage from "./pages/InsightsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/tasks" replace />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/tasks/:taskId/sessions" element={<SessionsPage />} />
        <Route path="/sessions/:sessionId/stats" element={<StatsPage />} />
        <Route path="/tasks/:taskId/insights" element={<InsightsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
