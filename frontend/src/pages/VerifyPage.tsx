import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, setToken } from "../api/client";

export default function VerifyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setError("Токен отсутствует"); return; }
    api.auth.verify(token)
      .then((result) => {
        setToken(result.access_token);
        setStatus("success");
      })
      .catch((err) => { setStatus("error"); setError(err.message); });
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "40px 32px", width: 380, textAlign: "center" }}>
        <h2 style={{ color: "var(--accent)", marginBottom: 16, fontWeight: 800, letterSpacing: "-0.5px" }}>FocusVoid</h2>

        {status === "loading" && <p style={{ color: "var(--text-2)" }}>Подтверждаем email...</p>}

        {status === "success" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <p style={{ fontWeight: 600, marginBottom: 8, color: "var(--text)" }}>Email подтверждён!</p>
            <p style={{ color: "var(--text-2)", marginBottom: 24, fontSize: 14 }}>Теперь можно войти в приложение</p>
            <button onClick={() => navigate("/tasks")} style={{
              padding: "10px 24px", background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            }}>
              Перейти к задачам
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✗</div>
            <p style={{ fontWeight: 600, marginBottom: 8, color: "var(--error)" }}>Ошибка</p>
            <p style={{ color: "var(--text-2)", marginBottom: 24, fontSize: 14 }}>{error}</p>
            <button onClick={() => navigate("/login")} style={{
              padding: "10px 24px", background: "var(--surface-2)", color: "var(--text-2)",
              border: "1px solid var(--border)", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            }}>
              На страницу входа
            </button>
          </>
        )}
      </div>
    </div>
  );
}
