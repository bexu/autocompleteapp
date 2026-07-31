"use client";

import { useState } from "react";
import { apiErrorItems, apiErrorTitle, type ApiErrorBody } from "@/lib/forms/error-text";

interface InstitutieOpt {
  id: string;
  label: string;
}

interface Result {
  formCode: string;
  title: string;
  dossierId: string;
  institutie: string;
}

export function PetitiiWizard({ institutii }: { institutii: InstitutieOpt[] }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<{ title: string; items: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      institutie: String(fd.get("institutie") ?? ""),
      subiect: String(fd.get("subiect") ?? ""),
      continut: String(fd.get("continut") ?? ""),
      solicitare: String(fd.get("solicitare") ?? ""),
    };
    const res = await fetch("/api/petitii/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b: ApiErrorBody = await res.json().catch(() => ({}));
      setError({ title: apiErrorTitle(b), items: apiErrorItems(b) });
      return;
    }
    setResult(await res.json());
  }

  if (result) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Petiție generată</p>
          <h1 className="page-title">{result.title}</h1>
        </div>
        <div className="card card--pad">
          <p>Petiția către <strong>{result.institutie}</strong> a fost generată și arhivată.</p>
          <a href={`/dashboard/dosare/${result.dossierId}`} data-testid="dosar-petitie" className="btn btn--primary btn--sm" style={{ marginTop: "0.8rem" }}>
            deschide dosarul
          </a>
        </div>
        <div className="notice" style={{ marginTop: "1.1rem" }}>
          <span aria-hidden="true">📮</span>
          <span>Trimite petiția la registratura instituției. Ai dreptul la răspuns în 30 de zile (OG 27/2002).</span>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Instrument universal</p>
        <h1 className="page-title">Petiție / sesizare</h1>
        <p className="lead">Trimite o cerere oficială către o instituție publică. Datele tale vin din profil.</p>
      </div>

      <div className="card card--pad">
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label" htmlFor="pw-inst">Instituția destinatară</label>
            <select id="pw-inst" className="select" name="institutie" required data-testid="institutie">
              {institutii.map((i) => (
                <option key={i.id} value={i.label}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pw-subiect">Subiect</label>
            <input id="pw-subiect" className="input" name="subiect" required data-testid="subiect" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pw-continut">Descrie situația</label>
            <textarea id="pw-continut" className="input" name="continut" rows={5} required data-testid="continut" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pw-solicitare">Ce soliciți concret</label>
            <textarea id="pw-solicitare" className="input" name="solicitare" rows={3} required data-testid="solicitare" />
          </div>
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="genereaza-petitie">
            {busy ? "Se generează..." : "Generează petiția"}
          </button>
        </form>
        {error && (
          <div role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>
            <strong>{error.title}</strong>
            {error.items.length > 0 && (
              <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem" }}>
                {error.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
