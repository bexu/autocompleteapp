"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Consent {
  category: "IDENTITATE" | "DOCUMENTE" | "CONTACT";
  granted: boolean;
}

const LABELS: Record<Consent["category"], string> = {
  IDENTITATE: "Date de identitate (CNP, serie/nr CI)",
  DOCUMENTE: "Documente încărcate (scanuri)",
  CONTACT: "Date de contact (telefon, IBAN)",
};

export function PrivacyPanel({ initial }: { initial: Consent[] }) {
  const router = useRouter();
  const [consents, setConsents] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle(category: Consent["category"], granted: boolean) {
    // Update optimist: reflectă imediat clicul, apoi reconciliază cu serverul.
    setConsents((prev) => prev.map((c) => (c.category === category ? { ...c, granted } : c)));
    const res = await fetch("/api/gdpr/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, action: granted ? "grant" : "withdraw" }),
    });
    if (res.ok) {
      setConsents((await res.json()).consents);
    } else {
      // revert la eșec
      setConsents((prev) => prev.map((c) => (c.category === category ? { ...c, granted: !granted } : c)));
    }
  }

  async function deleteData(scope: "data" | "account") {
    if (!confirm(scope === "account" ? "Ștergi definitiv contul și toate datele?" : "Ștergi toate datele personale?")) {
      return;
    }
    setBusy(true);
    const res = await fetch("/api/gdpr/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope }),
    });
    setBusy(false);
    if (res.ok) {
      if (scope === "account") router.push("/");
      else router.push("/dashboard");
    }
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Datele tale</p>
        <h1 className="page-title">Confidențialitate</h1>
        <p className="lead">Controlezi ce prelucrăm și îți poți lua sau șterge datele oricând.</p>
      </div>

      <div className="card card--pad">
        <p className="section-label" style={{ marginTop: 0 }}>Consimțământ per categorie</p>
        <div className="stack--sm" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {consents.map((c) => (
            <label key={c.category} className="checkbox-row" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={c.granted}
                data-testid={`consent-${c.category}`}
                onChange={(e) => toggle(c.category, e.target.checked)}
                style={{ accentColor: "var(--accent)" }}
              />
              {LABELS[c.category]}
            </label>
          ))}
        </div>
      </div>

      <div className="card card--pad" style={{ marginTop: "1.1rem" }}>
        <p className="section-label" style={{ marginTop: 0 }}>Drepturile tale (GDPR)</p>
        <div className="stack--sm">
          <p>
            <a href="/api/gdpr/export" data-testid="export" className="btn btn--ghost btn--sm">
              ↓ Descarcă toate datele (JSON)
            </a>
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost btn--sm" disabled={busy} data-testid="delete-data" onClick={() => deleteData("data")}>
              Șterge datele personale
            </button>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              disabled={busy}
              data-testid="delete-account"
              onClick={() => deleteData("account")}
            >
              Șterge contul
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
