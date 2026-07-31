"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Extracted {
  nume: string | null;
  prenume: string | null;
  cnp: string | null;
  ciSerie: string | null;
  ciNr: string | null;
  sex: "M" | "F" | null;
  dataNasterii: string | null;
  ciExp: string | null;
  source: "mrz" | "ocr" | "none";
}

// Date de EXEMPLU (demo) — CNP sintetic valid, consistent (Andrei = M). Se
// pre-completează când OCR-ul nu citește, ca fluxul să se poată parcurge; userul
// le înlocuiește cu ale lui înainte de salvare.
const DEMO: Extracted = {
  nume: "Popescu",
  prenume: "Andrei",
  cnp: "1960101223143",
  ciSerie: "TR",
  ciNr: "123456",
  sex: "M",
  dataNasterii: "1996-01-01",
  ciExp: "2030-01-01",
  source: "none",
};

export function OnboardingUpload() {
  const router = useRouter();
  const [phase, setPhase] = useState<"upload" | "review">("upload");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function useDemo() {
    setError(null);
    setInfo("Date de exemplu — verifică-le și înlocuiește-le cu ale tale.");
    setExtracted(DEMO);
    setPhase("review");
  }

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    form.set("tip", "CI");

    // Scanurile se prelucrează pe bază de consimțământ — îl acordăm explicit,
    // pe baza bifei din formular, înainte de a trimite fișierul.
    await fetch("/api/gdpr/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "DOCUMENTE", action: "grant" }),
    });

    const res = await fetch("/api/documents", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(
        res.status === 403
          ? "Ai nevoie de acordul pentru prelucrarea scanurilor (Confidențialitate)."
          : res.status === 413
            ? "Fișierul e prea mare (max. 8 MB)."
            : `Încărcare eșuată${b.error ? ": " + b.error : "."}`,
      );
      return;
    }
    const data = await res.json();
    if (!data.extracted || data.extracted.source === "none") {
      // Nu am citit automat → pre-completăm cu date de exemplu (demo), clar marcate.
      setInfo("Nu am putut citi automat. Am pus date de exemplu — înlocuiește-le cu ale tale.");
      setExtracted(DEMO);
      setPhase("review");
      return;
    }
    setExtracted(data.extracted);
    setPhase("review");
  }

  async function onConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);

    if (!form.get("consent")) {
      setBusy(false);
      setError("Bifează acordul pentru procesarea datelor de identitate.");
      return;
    }
    // Consimțământ explicit înainte de a salva date de identitate + scanul.
    await fetch("/api/gdpr/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "IDENTITATE", action: "grant" }),
    });
    await fetch("/api/gdpr/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "DOCUMENTE", action: "grant" }),
    });

    const payload: Record<string, unknown> = {};
    for (const key of ["nume", "prenume", "cnp", "ciSerie", "ciNr", "sex", "dataNasterii", "ciExp"]) {
      const v = String(form.get(key) ?? "").trim();
      if (v) payload[key] = v;
    }
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError("Date invalide: " + ((body.fields ?? []).join(", ") || "verifică câmpurile"));
      return;
    }
    router.push("/dashboard/profil");
  }

  if (phase === "upload") {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Onboarding · pas 1</p>
          <h1 className="page-title">Încarcă buletinul</h1>
          <p className="lead">Extragem automat datele din zona MRZ. Le confirmi tu înainte de salvare.</p>
        </div>
        <div className="card card--pad">
          <form onSubmit={onUpload} className="form">
            <div className="field">
              <label className="field__label" htmlFor="ob-file">Fișier CI (zona MRZ ca text, sau scan)</label>
              <input id="ob-file" className="input" type="file" name="file" required data-testid="file" />
            </div>
            <label className="row" style={{ gap: "0.5rem", alignItems: "flex-start" }}>
              <input type="checkbox" required data-testid="acord-scan" style={{ accentColor: "var(--accent)", marginTop: "0.2rem" }} />
              <span style={{ fontSize: "var(--fs-sm)" }}>
                Sunt de acord cu prelucrarea scanului pentru extragerea datelor. Scanul se
                stochează criptat și se șterge automat după 30 de zile. Îți poți retrage
                acordul oricând din <a href="/dashboard/confidentialitate" className="btn-link">Confidențialitate</a>.
              </span>
            </label>
            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={busy} data-testid="upload">
                {busy ? "Se procesează..." : "Încarcă și extrage"}
              </button>
              <button type="button" className="btn btn--ghost" onClick={useDemo} disabled={busy} data-testid="demo">
                Folosește date de exemplu
              </button>
            </div>
          </form>
          <p className="help" style={{ marginTop: "0.8rem" }}>
            Citirea automată merge din zona MRZ; pentru o poză, completează manual
            sau pornește de la datele de exemplu.
          </p>
          {error && (
            <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>{error}</p>
          )}
        </div>
      </main>
    );
  }

  const f = extracted;
  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Onboarding · pas 2</p>
        <h1 className="page-title">Confirmă datele extrase</h1>
        <p className="lead">Verifică și corectează dacă e nevoie, apoi salvează în profil.</p>
      </div>
      {info && (
        <div className="notice" data-testid="info" style={{ marginBottom: "1rem" }}>
          <span aria-hidden="true">ℹ️</span>
          <span>{info}</span>
        </div>
      )}
      <div className="card card--pad">
        <form onSubmit={onConfirm} className="form">
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Nume</label>
              <input className="input" name="nume" defaultValue={f?.nume ?? ""} placeholder="Nume" data-testid="f-nume" />
            </div>
            <div className="field">
              <label className="field__label">Prenume</label>
              <input className="input" name="prenume" defaultValue={f?.prenume ?? ""} placeholder="Prenume" data-testid="f-prenume" />
            </div>
          </div>
          <div className="field">
            <label className="field__label">CNP</label>
            <input className="input input--mono" name="cnp" defaultValue={f?.cnp ?? ""} inputMode="numeric" maxLength={13} data-testid="f-cnp" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Serie CI</label>
              <input className="input input--mono" name="ciSerie" defaultValue={f?.ciSerie ?? ""} placeholder="XX" data-testid="f-serie" />
            </div>
            <div className="field">
              <label className="field__label">Număr CI</label>
              <input className="input input--mono" name="ciNr" defaultValue={f?.ciNr ?? ""} placeholder="123456" data-testid="f-nr" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Sex (M/F)</label>
              <input className="input" name="sex" defaultValue={f?.sex ?? ""} placeholder="M/F" data-testid="f-sex" />
            </div>
            <div className="field">
              <label className="field__label">Data nașterii</label>
              <input className="input input--mono" name="dataNasterii" defaultValue={f?.dataNasterii ?? ""} placeholder="1990-01-01" data-testid="f-dob" />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Expirare CI</label>
            <input type="date" className="input input--mono" name="ciExp" defaultValue={f?.ciExp ?? ""} data-testid="f-exp" />
          </div>
          <label className="checkbox-row">
            <input type="checkbox" name="consent" data-testid="consent" />
            Sunt de acord cu procesarea datelor de identitate și a scanului.
          </label>
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="confirm">
            {busy ? "Se salvează..." : "Confirmă și salvează"}
          </button>
        </form>
        {error && (
          <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>{error}</p>
        )}
      </div>
    </main>
  );
}
