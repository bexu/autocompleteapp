"use client";

import { useState } from "react";

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

export function SomajWizard({ optiuniPlata }: { optiuniPlata: readonly string[] }) {
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const keys = [
      "ultimaFormaInvatamant", "actAbsolvire", "stareCivila", "cetatenie", "capacitateMunca",
      "experientaProfesionala", "ocupatiiDorite", "resedinta",
      "ultimulAngajator", "dataIncetare", "motivIncetare",
      "adeverintaMedicala", "optiunePlata", "acteFinanciare", "alteActe",
    ];
    const body = Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));
    const res = await fetch("/api/somaj/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(
        b.error === "validare"
          ? "Verifică profilul și câmpurile obligatorii: " + (b.fields ?? []).join(", ")
          : "Generare eșuată: " + (b.error ?? ""),
      );
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
          <ol className="steps" data-testid="somaj-checklist">
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
        <h1 className="page-title">Am rămas fără loc de muncă</h1>
        <p className="lead">Generăm înregistrarea la ANOFM (mediere) și cererea de indemnizație de șomaj. Datele tale de identitate vin din profil.</p>
      </div>

      <div className="card card--pad">
        <form onSubmit={onSubmit} className="form">
          <p className="section-label" style={{ marginTop: 0 }}>Studii și profil</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="sw-forma">Ultima formă de învățământ</label>
              <input id="sw-forma" className="input" name="ultimaFormaInvatamant" required data-testid="ultima-forma" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="sw-act">Act de absolvire (serie, nr., dată, autoritate)</label>
              <input id="sw-act" className="input" name="actAbsolvire" required data-testid="act-absolvire" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="sw-civila">Starea civilă</label>
              <input id="sw-civila" className="input" name="stareCivila" required data-testid="stare-civila" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="sw-cetatenie">Cetățenia</label>
              <input id="sw-cetatenie" className="input" name="cetatenie" required data-testid="cetatenie" />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sw-capacitate">Capacitatea de muncă / restricții medicale</label>
            <input id="sw-capacitate" className="input" name="capacitateMunca" required data-testid="capacitate-munca" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sw-exp">Experiență profesională <span className="muted">(opțional)</span></label>
            <textarea id="sw-exp" className="input" name="experientaProfesionala" rows={2} data-testid="experienta" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="sw-ocupatii">Ocupații dorite <span className="muted">(opțional)</span></label>
              <input id="sw-ocupatii" className="input" name="ocupatiiDorite" data-testid="ocupatii-dorite" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="sw-resedinta">Reședința, dacă diferă <span className="muted">(opțional)</span></label>
              <input id="sw-resedinta" className="input" name="resedinta" data-testid="resedinta" />
            </div>
          </div>

          <p className="section-label">Încetarea ultimului loc de muncă</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="sw-ang">Ultimul angajator</label>
              <input id="sw-ang" className="input" name="ultimulAngajator" required data-testid="ultimul-angajator" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="sw-data">Data încetării</label>
              <input id="sw-data" className="input input--mono" name="dataIncetare" placeholder="2026-07-01" required data-testid="data-incetare" />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="sw-motiv">Motivul/temeiul încetării</label>
            <input id="sw-motiv" className="input" name="motivIncetare" required data-testid="motiv-incetare" />
          </div>

          <p className="section-label">Indemnizație</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="sw-adev">Adeverință medicală (nr. și dată)</label>
              <input id="sw-adev" className="input" name="adeverintaMedicala" required data-testid="adeverinta-medicala" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="sw-plata">Opțiune de plată</label>
              <select id="sw-plata" className="select" name="optiunePlata" required data-testid="optiune-plata">
                {optiuniPlata.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="sw-financiare">Acte organe financiare <span className="muted">(opțional)</span></label>
              <input id="sw-financiare" className="input" name="acteFinanciare" data-testid="acte-financiare" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="sw-alte">Alte acte anexate <span className="muted">(opțional)</span></label>
              <input id="sw-alte" className="input" name="alteActe" data-testid="alte-acte" />
            </div>
          </div>

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
