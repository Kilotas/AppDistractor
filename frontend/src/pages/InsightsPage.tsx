import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { TaskInsights } from "../api/client";
import { useT } from "../i18n";
import LangToggle from "../components/LangToggle";
import styles from "./InsightsPage.module.css";

export default function InsightsPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { t } = useT();
  const [insights, setInsights] = useState<TaskInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    api.insights.get(Number(taskId))
      .then(setInsights)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 402) {
          setPaymentRequired(true);
        } else {
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));
  }, [taskId]);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const { url } = await api.billing.checkout();
      window.location.href = url;
    } catch (e: any) {
      setError(e.message);
      setCheckoutLoading(false);
    }
  }

  if (loading) return <div className={styles.center}>{t("analyzing")}</div>;

  if (paymentRequired) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.back} onClick={() => navigate(-1)}>{t("back")}</button>
          <h1 className={styles.title}>{t("aiTitle")}</h1>
          <LangToggle />
        </header>
        <div className={styles.paywall}>
          <div className={styles.paywallIcon}>🔒</div>
          <div className={styles.paywallTitle}>{t("proFeature")}</div>
          <div className={styles.paywallDesc}>
            {t("proDesc").split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <button
            className={styles.btnUpgrade}
            onClick={handleCheckout}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? t("checkoutLoading") : t("btnUpgrade")}
          </button>
        </div>
      </div>
    );
  }

  if (error) return <div className={`${styles.center} ${styles.error}`}>{error}</div>;
  if (!insights) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate(-1)}>{t("back")}</button>
        <h1 className={styles.title}>{t("aiTitle")}</h1>
        <LangToggle />
      </header>

      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardValue}>{insights.total_sessions}</div>
          <div className={styles.cardLabel}>{t("totalSessions")}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardValue}>
            {insights.avg_focus_score !== null ? Math.round(insights.avg_focus_score) : "—"}
          </div>
          <div className={styles.cardLabel}>{t("avgScore")}</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t("observations")}</div>
        <ul className={styles.list}>
          {insights.insights.map((text, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.bullet}>→</span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>{t("recommendations")}</div>
        <ul className={styles.list}>
          {insights.recommendations.map((text, i) => (
            <li key={i} className={styles.item}>
              <span className={styles.bullet}>✦</span>
              {text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
