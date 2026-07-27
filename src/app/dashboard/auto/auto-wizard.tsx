"use client";

import { useState } from "react";

interface VehiculOpt {
  id: string;
  label: string;
}

interface FormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

interface CaseResult {
  label: string;
  checklist: string[];
  forms: FormResult[];
}

export function AutoWizard({ vehicule }: { vehicule: VehiculOpt[] }) {
  const [event, setEvent] = useState<"VANZARE" | "CUMPARARE">("VANZARE");
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      event,
      vehicleId: String(fd.get("vehicleId") ?? ""),
      contrapartaNume: String(fd.get("contrapartaNume") ?? ""),
      contrapartaCnp: String(fd.get("contrapartaCnp") ?? ""),
      pret: String(fd.get("pret") ?? ""),
      data: String(fd.get("data") ?? ""),
    };
    const res = await fetch("/api/auto/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(
        b.error === "validare"
          ? "Completează profilul și datele vehiculului: " + (b.fields ?? []).join(", ")
          : "Generare eșuată: " + (b.error ?? ""),
      );
      return;
    }
    setResult(await res.json());
  }

  if (vehicule.length === 0) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Eveniment de viață</p>
          <h1 className="page-title">Dosar auto</h1>
        </div>
        <div className="notice" data-testid="no-vehicle">
          <span aria-hidden="true">🚗</span>
          <span>Adaugă întâi un vehicul în „Vehiculele mele”, apoi revino aici.</span>
        </div>
      </main>
    );
  }

  if (result) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Dosar generat</p>
          <h1 className="page-title">{result.label}</h1>
        </div>

        <div className="card card--pad">
          <p className="section-label" style={{ marginTop: 0 }}>Documente generate</p>
          <ul className="list" data-testid="forms">
            {result.forms.map((f) => (
              <li key={f.dossierId} className="list__item" data-testid={`form-${f.formCode}`}>
                <span className="list__main">
                  <span className="mono">{f.formCode}</span>{" "}
                  <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>— {f.title}</span>
                </span>
                <a href={`/dashboard/dosare/${f.dossierId}`} data-testid={`dosar-${f.formCode}`} className="btn btn--ghost btn--sm">
                  deschide dosarul
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="card card--pad" style={{ marginTop: "1.1rem" }}>
          <p className="section-label" style={{ marginTop: 0 }}>Pași de urmat</p>
          <ol className="steps" data-testid="auto-checklist">
            {result.checklist.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Eveniment de viață</p>
        <h1 className="page-title">Dosar auto</h1>
        <p className="lead">Ce s-a întâmplat? Generăm documentele și pașii potriviți.</p>
      </div>

      <div className="card card--pad">
        <div className="row" style={{ gap: "1.2rem", marginBottom: "1.1rem" }}>
          <label className="row" style={{ gap: "0.5rem" }}>
            <input type="radio" checked={event === "VANZARE"} onChange={() => setEvent("VANZARE")} data-testid="ev-vanzare" style={{ accentColor: "var(--accent)" }} />
            Am vândut mașina
          </label>
          <label className="row" style={{ gap: "0.5rem" }}>
            <input type="radio" checked={event === "CUMPARARE"} onChange={() => setEvent("CUMPARARE")} data-testid="ev-cumparare" style={{ accentColor: "var(--accent)" }} />
            Am cumpărat o mașină
          </label>
        </div>

        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label" htmlFor="aw-vehicle">Vehicul</label>
            <select id="aw-vehicle" className="select" name="vehicleId" required data-testid="vehicleId">
              {vehicule.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {event === "VANZARE" && (
            <>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="aw-cnume">Cumpărător — nume</label>
                  <input id="aw-cnume" className="input" name="contrapartaNume" placeholder="Nume complet" data-testid="contraparta-nume" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="aw-ccnp">Cumpărător — CNP</label>
                  <input id="aw-ccnp" className="input input--mono" name="contrapartaCnp" placeholder="13 cifre" data-testid="contraparta-cnp" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="aw-pret">Preț (lei)</label>
                  <input id="aw-pret" className="input input--mono" name="pret" placeholder="15000" data-testid="pret" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="aw-data">Data tranzacției</label>
                  <input id="aw-data" className="input input--mono" name="data" placeholder="2026-03-01" data-testid="data" />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="genereaza-dosar">
            {busy ? "Se generează..." : "Generează dosarul"}
          </button>
        </form>
        {error && (
          <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
