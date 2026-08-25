import { useT } from "../i18n";
import type { Lang, Theme } from "../i18n";

export default function LangToggle() {
  const { lang, setLang, theme, setTheme } = useT();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* Переключатель темы */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        style={{
          width: 32, height: 32,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 16,
          cursor: "pointer",
          transition: "background 0.15s",
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      {/* Переключатель языка */}
      <div style={{
        display: "flex", gap: 2,
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        borderRadius: 8, padding: 2,
      }}>
        {(["ru", "en"] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              padding: "4px 9px",
              fontSize: 12,
              fontWeight: lang === l ? 700 : 400,
              background: lang === l ? "var(--accent)" : "transparent",
              color: lang === l ? "#fff" : "var(--text-muted)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
