"use client";

import { useState } from "react";
import { apiErrorItems, apiErrorTitle, type ApiErrorBody } from "@/lib/forms/error-text";

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

export function CopilWizard() {
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<{ title: string; items: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      copilNume: String(fd.get("copilNume") ?? ""),
      copilPrenume: String(fd.get("copilPrenume") ?? ""),
      copilCnp: String(fd.get("copilCnp") ?? ""),
      copilDataNasterii: String(fd.get("copilDataNasterii") ?? ""),
      angajator: String(fd.get("angajator") ?? ""),
      cui: String(fd.get("cui") ?? ""),
      perioadaConcediu: String(fd.get("perioadaConcediu") ?? ""),
    };
    const res = await fetch("/api/copil/generate", {
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
          <ol className="steps" data-testid="copil-checklist">
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
        <h1 className="page-title">Am devenit părinte</h1>
        <p className="lead">Generăm cererea de alocație de stat și dosarul de indemnizație creștere copil.</p>
      </div>

      <div className="card card--pad">
        <form onSubmit={onSubmit} className="form">
          <p className="section-label" style={{ marginTop: 0 }}>Datele copilului</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cw-nume">Nume copil</label>
              <input id="cw-nume" className="input" name="copilNume" required data-testid="copil-nume" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cw-prenume">Prenume copil</label>
              <input id="cw-prenume" className="input" name="copilPrenume" required data-testid="copil-prenume" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cw-cnp">CNP copil</label>
              <input id="cw-cnp" className="input input--mono" name="copilCnp" inputMode="numeric" maxLength={13} pattern="\d{13}" required data-testid="copil-cnp" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cw-data">Data nașterii</label>
              <input id="cw-data" type="date" className="input input--mono" name="copilDataNasterii" required data-testid="copil-data" />
            </div>
          </div>

          <p className="section-label">Pentru indemnizație (angajator)</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cw-ang">Angajator</label>
              <input id="cw-ang" className="input" name="angajator" required data-testid="angajator" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cw-cui">CUI angajator</label>
              <input id="cw-cui" className="input input--mono" name="cui" data-testid="cui" />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="cw-per">Perioada concediului</label>
            <input id="cw-per" className="input" name="perioadaConcediu" placeholder="01.07.2026 – 01.07.2028" required data-testid="perioada" />
          </div>

          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="genereaza-dosar">
            {busy ? "Se generează..." : "Generează dosarul"}
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
