import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, setGuest, clearToken } from "../api/client";
import { useT } from "../i18n";
import LangToggle from "../components/LangToggle";

type Mode = "login" | "register";

export default function LoginPage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  function validatePassword(password: string): string | null {
    if (password.length < 8) return t("pwdMin");
    if (!/[A-Z]/.test(password)) return t("pwdUpper");
    if (!/[a-z]/.test(password)) return t("pwdLower");
    if (!/\d/.test(password)) return t("pwdDigit");
    return null;
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "register") {
      const pwdError = validatePassword(password);
      if (pwdError) { setError(pwdError); return; }
      if (password !== confirmPassword) { setError(t("pwdMismatch")); return; }
    }

    setLoading(true);
    try {
      const result = mode === "login"
        ? await api.auth.login(email, password)
        : await api.auth.register(email, password, confirmPassword);
      setToken(result.access_token);
      if (mode === "register") {
        setCheckEmail(true);
      } else {
        navigate("/tasks");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setGuestLoading(true);
    setError(null);
    try {
      const result = await api.auth.guest();
      setToken(result.access_token);
      setGuest();
      navigate("/tasks");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setGuestLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h2 style={{ marginBottom: 8, color: "var(--text)" }}>{t("checkEmailTitle")}</h2>
          <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 24 }}>
            {t("checkEmailDesc")} <strong style={{ color: "var(--text)" }}>{email}</strong>
          </p>
          <ResendButton onResend={async () => { await api.auth.resendVerification(); }} />
          <button onClick={() => { clearToken(); setCheckEmail(false); }} style={{
            marginTop: 12, background: "none", border: "none", color: "var(--text-muted)",
            fontSize: 13, cursor: "pointer",
          }}>
            {t("switchAccount")}
          </button>
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
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
          {t("loginTagline")}
        </p>

        <div style={{ display: "flex", marginBottom: 20, borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
          {(["login", "register"] as Mode[]).map((m) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: "9px 0", border: "none",
              background: mode === m ? "var(--accent)" : "var(--surface-2)",
              color: mode === m ? "#fff" : "var(--text-2)",
              fontWeight: mode === m ? 600 : 400,
              cursor: "pointer", fontSize: 14,
              transition: "background 0.15s",
            }}>
              {m === "login" ? t("tabLogin") : t("tabRegister")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email" placeholder={t("placeholderEmail")} value={email} required
            onChange={(e) => setEmail(e.target.value)} style={inputStyle}
          />
          <input
            type="password" placeholder={t("placeholderPassword")} value={password} required
            onChange={(e) => setPassword(e.target.value)} style={inputStyle}
          />

          {mode === "register" && (
            <>
              <input
                type="password" placeholder={t("placeholderConfirmPassword")} value={confirmPassword} required
                onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle}
              />
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
                {t("passwordHint")}
              </p>
            </>
          )}

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
            {loading ? "..." : mode === "login" ? t("btnLogin") : t("btnRegister")}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "20px 0 4px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t("orDivider")}</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button onClick={handleGuest} disabled={guestLoading} style={{
          width: "100%", padding: "10px", background: "transparent",
          border: "1px solid var(--border)", borderRadius: 8,
          fontSize: 14, color: "var(--text-2)", cursor: guestLoading ? "not-allowed" : "pointer",
          opacity: guestLoading ? 0.6 : 1, transition: "border-color 0.15s",
        }}>
          {guestLoading ? "..." : t("btnGuest")}
        </button>
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
  width: "100%", padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8, fontSize: 14, outline: "none",
  background: "var(--surface-2)",
  color: "var(--text)",
};

function ResendButton({ onResend }: { onResend: () => Promise<void> }) {
  const { t } = useT();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try { await onResend(); setSent(true); } finally { setLoading(false); }
  }

  if (sent) return <p style={{ fontSize: 13, color: "var(--success)" }}>{t("resendSuccess")}</p>;
  return (
    <button onClick={handle} disabled={loading} style={{
      background: "none", border: "1px solid var(--border)", borderRadius: 8,
      padding: "8px 16px", fontSize: 13, color: "var(--text-2)", cursor: "pointer",
    }}>
      {loading ? "..." : t("resendBtn")}
    </button>
  );
}
