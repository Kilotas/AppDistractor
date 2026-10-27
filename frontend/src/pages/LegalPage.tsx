import { Link, useNavigate } from "react-router-dom";
import { useT } from "../i18n";
import LangToggle from "../components/LangToggle";
import { legalDocs, LEGAL_UPDATED, CONTACT_URL } from "./legalContent";
import type { LegalKind } from "./legalContent";

// Публичная страница (без RequireAuth): ссылку на неё требует Chrome Web Store.
export default function LegalPage({ kind }: { kind: LegalKind }) {
  const navigate = useNavigate();
  const { lang, locale } = useT();
  const doc = legalDocs[kind][lang];
  const other: LegalKind = kind === "privacy" ? "terms" : "privacy";
  const updated = new Date(LEGAL_UPDATED).toLocaleDateString(locale, {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", padding: "32px 16px" }}>
      <article style={{
        maxWidth: 760, margin: "0 auto", background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: 14, padding: "32px 28px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <button onClick={() => navigate(-1)} style={{
            background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", padding: 0,
          }}>
            {lang === "ru" ? "← Назад" : "← Back"}
          </button>
          <LangToggle />
        </div>

        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", letterSpacing: "-0.5px", marginBottom: 4 }}>
          FocusVoid
        </div>
        <h1 style={{ fontSize: 26, color: "var(--text)", marginBottom: 6 }}>{doc.title}</h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 28 }}>
          {doc.updatedLabel}: {updated}
        </p>

        {doc.sections.map((s) => (
          <section key={s.heading} style={{ marginBottom: 22 }}>
            <h2 style={{ fontSize: 17, color: "var(--text)", marginBottom: 8 }}>{s.heading}</h2>
            {s.paragraphs.map((p) => (
              <p key={p} style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.65, margin: "0 0 8px" }}>{p}</p>
            ))}
          </section>
        ))}

        <a href={CONTACT_URL} target="_blank" rel="noreferrer" style={{ fontSize: 14, color: "var(--accent)", wordBreak: "break-all" }}>
          {CONTACT_URL}
        </a>

        <div style={{ borderTop: "1px solid var(--border)", marginTop: 28, paddingTop: 16 }}>
          <Link to={`/${other}`} style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
            {legalDocs[other][lang].title} →
          </Link>
        </div>
      </article>
    </div>
  );
}
