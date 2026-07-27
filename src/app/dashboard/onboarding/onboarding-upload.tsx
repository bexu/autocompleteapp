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
  source: "mrz" | "none";
}

export function OnboardingUpload() {
  const router = useRouter();
  const [phase, setPhase] = useState<"upload" | "review">("upload");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    form.set("tip", "CI");
    const res = await fetch("/api/documents", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      setError("Încărcare eșuată.");
      return;
    }
    const data = await res.json();
    if (!data.extracted || data.extracted.source === "none") {
      setError("Nu am putut citi datele automat. Completează-le manual în profil.");
      setExtracted(null);
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
              <label className="field__label" htmlFor="ob-file">Fișier CI</label>
              <input id="ob-file" className="input" type="file" name="file" required data-testid="file" />
            </div>
            <button type="submit" className="btn btn--primary" disabled={busy} data-testid="upload">
              {busy ? "Se procesează..." : "Încarcă și extrage"}
            </button>
          </form>
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
            <input className="input input--mono" name="cnp" defaultValue={f?.cnp ?? ""} placeholder="CNP" data-testid="f-cnp" />
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
            <input className="input input--mono" name="ciExp" defaultValue={f?.ciExp ?? ""} placeholder="2030-01-01" data-testid="f-exp" />
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
