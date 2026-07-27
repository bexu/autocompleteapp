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
    <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Confidențialitate</h1>

      <section>
        <h2>Consimțământ per categorie</h2>
        {consents.map((c) => (
          <label key={c.category} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              type="checkbox"
              checked={c.granted}
              data-testid={`consent-${c.category}`}
              onChange={(e) => toggle(c.category, e.target.checked)}
            />
            {LABELS[c.category]}
          </label>
        ))}
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Drepturile tale</h2>
        <p>
          <a href="/api/gdpr/export" data-testid="export">
            Descarcă toate datele (JSON)
          </a>
        </p>
        <button type="button" disabled={busy} data-testid="delete-data" onClick={() => deleteData("data")}>
          Șterge datele personale
        </button>{" "}
        <button
          type="button"
          disabled={busy}
          data-testid="delete-account"
          onClick={() => deleteData("account")}
          style={{ color: "crimson" }}
        >
          Șterge contul
        </button>
      </section>
    </main>
  );
}
