import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { useT } from "../i18n";
import LangToggle from "../components/LangToggle";

export default function ResetPasswordPage() {
  const { t } = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: "var(--error)", marginBottom: 24 }}>{t("resetTokenMissing")}</p>
          <Link to="/login" style={backLinkStyle}>{t("backToLogin")}</Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 8, color: "var(--text)" }}>{t("resetSuccess")}</h2>
          <button
            onClick={() => navigate("/login")}
            style={{
              marginTop: 16, padding: "10px 24px", background: "var(--accent)", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            {t("btnLogin")}
          </button>
        </div>
      </div>
    );
  }

  function validatePassword(pwd: string): string | null {
    if (pwd.length < 8) return t("pwdMin");
    if (!/[A-Z]/.test(pwd)) return t("pwdUpper");
    if (!/[a-z]/.test(pwd)) return t("pwdLower");
    if (!/\d/.test(pwd)) return t("pwdDigit");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwdError = validatePassword(newPassword);
    if (pwdError) { setError(pwdError); return; }
    if (newPassword !== confirmPassword) { setError(t("pwdMismatch")); return; }

    setLoading(true);
    try {
      await api.auth.resetPassword(token, newPassword, confirmPassword);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <LangToggle />
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--accent)", marginBottom: 6, letterSpacing: "-0.5px" }}>
          FocusVoid
        </h1>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>
          {t("resetTitle")}
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
          {t("resetDesc")}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            placeholder={t("placeholderNewPassword")}
            value={newPassword}
            required
            onChange={(e) => setNewPassword(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder={t("placeholderConfirmPassword")}
            value={confirmPassword}
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            {t("passwordHint")}
          </p>

          {error && (
            <div style={{ fontSize: 13, color: "var(--error)", background: "var(--error-bg)", padding: "8px 10px", borderRadius: 6 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            marginTop: 4, padding: "10px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
          }}>
            {loading ? "..." : t("btnResetPassword")}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link to="/login" style={backLinkStyle}>{t("backToLogin")}</Link>
        </div>
      </div>
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--bg)",
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "32px 28px",
  width: 380,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  background: "var(--surface-2)",
  color: "var(--text)",
};

const backLinkStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--text-muted)",
  textDecoration: "none",
};
