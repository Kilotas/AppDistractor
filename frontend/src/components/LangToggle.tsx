import { useT } from "../i18n";
import type { Lang } from "../i18n";

export default function LangToggle() {
  const { lang, setLang } = useT();

  return (
    <div style={{ display: "flex", gap: 2, background: "var(--surface-2)", borderRadius: 6, padding: 2 }}>
      {(["ru", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          style={{
            padding: "3px 8px",
            fontSize: 12,
            fontWeight: lang === l ? 700 : 400,
            background: lang === l ? "var(--accent)" : "transparent",
            color: lang === l ? "#fff" : "var(--text-muted)",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            transition: "background 0.15s",
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
