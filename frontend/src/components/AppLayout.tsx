import { useNavigate, useLocation } from "react-router-dom";
import { clearToken } from "../api/client";
import { useT } from "../i18n";
import LangToggle from "./LangToggle";
import styles from "./AppLayout.module.css";

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useT();

  function isActive(path: string) {
    return location.pathname.startsWith(path);
  }

  return (
    <div className={styles.root}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>FocusVoid</div>

        <nav className={styles.nav}>
          <button
            className={`${styles.navItem} ${isActive("/tasks") ? styles.navItemActive : ""}`}
            onClick={() => navigate("/tasks")}
          >
            <span className={styles.navIcon}>🎯</span>
            {t("navTasks")}
          </button>
          <button
            className={`${styles.navItem} ${isActive("/dashboard") ? styles.navItemActive : ""}`}
            onClick={() => navigate("/dashboard")}
          >
            <span className={styles.navIcon}>📊</span>
            {t("dashboardTitle")}
          </button>
          <button
            className={`${styles.navItem} ${isActive("/routines") ? styles.navItemActive : ""}`}
            onClick={() => navigate("/routines")}
          >
            <span className={styles.navIcon}>🔔</span>
            Рутины
          </button>
          <button
            className={`${styles.navItem} ${isActive("/profile") ? styles.navItemActive : ""}`}
            onClick={() => navigate("/profile")}
          >
            <span className={styles.navIcon}>👤</span>
            {t("profileTitle")}
          </button>
        </nav>

        <div className={styles.bottom}>
          <LangToggle />
          <button
            className={styles.logoutBtn}
            onClick={() => { clearToken(); navigate("/login"); }}
          >
            {t("logout")}
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
