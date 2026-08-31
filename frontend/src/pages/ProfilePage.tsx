import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearToken } from "../api/client";
import type { User } from "../api/client";
import { useT } from "../i18n";
import AppLayout from "../components/AppLayout";
import styles from "./ProfilePage.module.css";

function validatePassword(pwd: string, t: (k: string) => string): string | null {
  if (pwd.length < 8) return t("pwdMin");
  if (!/[A-Z]/.test(pwd)) return t("pwdUpper");
  if (!/[a-z]/.test(pwd)) return t("pwdLower");
  if (!/\d/.test(pwd)) return t("pwdDigit");
  return null;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, locale } = useT();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    api.auth.me()
      .then(setUser)
      .catch(() => { clearToken(); navigate("/login"); })
      .finally(() => setLoadingUser(false));
  }, []);

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  }

  function trialStatus(): string {
    if (!user?.trial_ends_at) return "";
    const ends = new Date(user.trial_ends_at);
    if (ends < new Date()) return t("profileTrialExpired");
    return `${t("profileTrial")} ${formatDate(user.trial_ends_at)}`;
  }

  async function handleChangePwd(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    const err = validatePassword(newPwd, t);
    if (err) { setPwdError(err); return; }
    if (newPwd !== confirmPwd) { setPwdError(t("pwdMismatch")); return; }

    setSavingPwd(true);
    try {
      await api.auth.changePassword(currentPwd, newPwd, confirmPwd);
      setPwdSuccess(true);
      setShowPwdForm(false);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSavingPwd(false);
    }
  }

  if (loadingUser) return <AppLayout><div className={styles.center}>{t("loading")}</div></AppLayout>;
  if (!user) return null;

  return (
    <AppLayout>
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t("profileTitle")}</h1>
      </header>

      {/* Карточка аккаунта */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>{t("profileEmail")}</div>
        <div className={styles.cardValue}>{user.email}</div>

        <div className={styles.divider} />

        <div className={styles.row}>
          <div>
            <div className={styles.cardTitle}>{t("profilePlan")}</div>
            <div className={styles.cardValue}>
              <span className={`${styles.planBadge} ${user.plan === "pro" ? styles.planPro : styles.planFree}`}>
                {user.plan === "pro" ? t("profilePlanPro") : t("profilePlanFree")}
              </span>
              {user.plan === "free" && user.trial_ends_at && (
                <span className={styles.trialNote}>{trialStatus()}</span>
              )}
            </div>
          </div>
          <div>
            <div className={styles.cardTitle}>{t("profileMember")}</div>
            <div className={styles.cardValue}>{formatDate(user.created_at)}</div>
          </div>
        </div>
      </div>

      {/* Смена пароля */}
      <div className={styles.card}>
        <div className={styles.pwdHeader}>
          <div className={styles.sectionTitle}>{t("profileChangePwd")}</div>
          {!showPwdForm && (
            <button
              className={styles.btnTogglePwd}
              onClick={() => { setShowPwdForm(true); setPwdSuccess(false); setPwdError(null); }}
            >
              {t("profileChangePwd")}
            </button>
          )}
        </div>

        {pwdSuccess && (
          <div className={styles.success}>{t("profilePwdSuccess")}</div>
        )}

        {showPwdForm && (
        <form onSubmit={handleChangePwd} className={styles.form}>
          <input
            className={styles.input}
            type="password"
            placeholder={t("profileCurrentPwd")}
            value={currentPwd}
            required
            autoFocus
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
          <input
            className={styles.input}
            type="password"
            placeholder={t("profileNewPwd")}
            value={newPwd}
            required
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <input
            className={styles.input}
            type="password"
            placeholder={t("profileConfirmPwd")}
            value={confirmPwd}
            required
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
          <p className={styles.hint}>{t("passwordHint")}</p>

          {pwdError && <div className={styles.error}>{pwdError}</div>}

          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.btnSave}
              disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd}
            >
              {savingPwd ? "..." : t("profileSavePwd")}
            </button>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={() => {
                setShowPwdForm(false);
                setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
                setPwdError(null);
              }}
            >
              {t("back")}
            </button>
          </div>
        </form>
        )}
      </div>

      {/* Выход */}
      <button
        className={styles.btnLogout}
        onClick={() => { clearToken(); navigate("/login"); }}
      >
        {t("logout")}
      </button>
    </div>
    </AppLayout>
  );
}
