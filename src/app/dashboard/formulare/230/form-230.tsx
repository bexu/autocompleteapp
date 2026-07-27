"use client";

import { useState } from "react";

export function Form230() {
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const inputs = {
      beneficiarDenumire: String(form.get("beneficiarDenumire") ?? ""),
      beneficiarCif: String(form.get("beneficiarCif") ?? ""),
      beneficiarIban: String(form.get("beneficiarIban") ?? ""),
      doiAni: form.get("doiAni") === "on",
    };

    const res = await fetch("/api/forms/230", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === "validare") {
        const fields: string[] = body.fields ?? [];
        setError(
          fields.includes("cnp") || fields.includes("nume")
            ? "Completează-ți întâi profilul (nume, CNP)."
            : "Date invalide: " + fields.join(", "),
        );
      } else {
        setError("Generare eșuată.");
      }
      return;
    }

    // Descarcă PDF-ul generat.
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formular-230.pdf";
    a.click();
    URL.revokeObjectURL(url);
    setDone(true);
  }

  return (
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Formular 230 — redirecționare 3,5%</h1>
      <p>Datele tale vin din profil. Completează entitatea beneficiară.</p>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <input name="beneficiarDenumire" placeholder="Denumire entitate" required data-testid="benef-denumire" />
        <input name="beneficiarCif" placeholder="CIF entitate" required data-testid="benef-cif" />
        <input name="beneficiarIban" placeholder="IBAN entitate" required data-testid="benef-iban" />
        <label style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" name="doiAni" data-testid="benef-doiani" />
          Redirecționez pe 2 ani
        </label>
        <button type="submit" disabled={busy} data-testid="genereaza">
          {busy ? "Se generează..." : "Generează PDF"}
        </button>
      </form>
      {done && <p data-testid="done" style={{ color: "green" }}>PDF generat și descărcat.</p>}
      {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
