import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, getToken, clearToken } from "../api/client";
import { useT } from "../i18n";
import LangToggle from "../components/LangToggle";

// Экран для неподтверждённого email.
// С токеном — email берём из /auth/me; без токена — из ?email= или поля ввода.
export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t } = useT();
  const hasToken = !!getToken();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasToken) return;
    api.auth.me()
      .then((user) => {
        if (user.is_verified) navigate("/tasks", { replace: true });
        else setEmail(user.email);
      })
      .catch(() => {});
  }, [hasToken, navigate]);

  async function handleCheck() {
    setChecking(true);
    setError(null);
    try {
      const user = await api.auth.me();
      if (user.is_verified) navigate("/tasks", { replace: true });
      else setError(t("notVerifiedYet"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setChecking(false);
    }
  }

  function handleSwitchAccount() {
    clearToken();
    navigate("/login");
  }

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <LangToggle />
        </div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
        <h2 style={{ marginBottom: 8, color: "var(--text)" }}>{t("checkEmailTitle")}</h2>

        {hasToken ? (
          <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 24 }}>
            {t("checkEmailDesc")} <strong style={{ color: "var(--text)" }}>{email}</strong>
          </p>
        ) : (
          <>
            <p style={{ color: "var(--text-2)", fontSize: 14, marginBottom: 12 }}>{t("verifyEmailHint")}</p>
            <input
              type="email" placeholder={t("placeholderEmail")} value={email}
              onChange={(e) => setEmail(e.target.value)} style={{ ...inputStyle, marginBottom: 16 }}
            />
          </>
        )}

        <ResendButton
          disabled={!email}
          onResend={async () => { await api.auth.resendVerification(email); }}
        />

        {hasToken && (
          <button onClick={handleCheck} disabled={checking} style={{
            display: "block", width: "100%", marginTop: 16, padding: "10px",
            background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8,
            fontSize: 14, fontWeight: 600, cursor: checking ? "not-allowed" : "pointer",
            opacity: checking ? 0.6 : 1,
          }}>
            {checking ? "..." : t("alreadyVerifiedBtn")}
          </button>
        )}

        {error && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--error)", background: "var(--error-bg)", padding: "8px 10px", borderRadius: 6 }}>
            {error}
          </div>
        )}

        <button onClick={handleSwitchAccount} style={{
          marginTop: 12, background: "none", border: "none", color: "var(--text-muted)",
          fontSize: 13, cursor: "pointer",
        }}>
          {hasToken ? t("switchAccount") : t("backToLogin")}
        </button>
      </div>
    </div>
  );
}

function ResendButton({ onResend, disabled }: { onResend: () => Promise<void>; disabled?: boolean }) {
  const { t } = useT();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try { await onResend(); setSent(true); } finally { setLoading(false); }
  }

  if (sent) return <p style={{ fontSize: 13, color: "var(--success)" }}>{t("resendSuccess")}</p>;
  return (
    <button onClick={handle} disabled={loading || disabled} style={{
      background: "none", border: "1px solid var(--border)", borderRadius: 8,
      padding: "8px 16px", fontSize: 13, color: "var(--text-2)",
      cursor: loading || disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.6 : 1,
    }}>
      {loading ? "..." : t("resendBtn")}
    </button>
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
  textAlign: "center",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: 8, fontSize: 14, outline: "none",
  background: "var(--surface-2)",
  color: "var(--text)",
};
