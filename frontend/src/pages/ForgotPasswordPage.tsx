import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useT } from "../i18n";
import LangToggle from "../components/LangToggle";

export default function ForgotPasswordPage() {
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ marginBottom: 8, color: "var(--text)" }}>{t("checkEmailTitle")}</h2>
          <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.6 }}>
            {t("forgotSuccess")}
          </p>
          <Link to="/login" style={backLinkStyle}>{t("backToLogin")}</Link>
        </div>
      </div>
    );
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
          {t("forgotTitle")}
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
          {t("forgotDesc")}
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder={t("placeholderEmail")}
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

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
            {loading ? "..." : t("btnSendReset")}
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
