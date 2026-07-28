"use client";

import { useState } from "react";

interface ImobilOpt {
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

interface Enums {
  felInscriere: readonly string[];
  modComunicare: readonly string[];
  regimSolutionare: readonly string[];
  scopExtras: readonly string[];
  calitateSolicitant: readonly string[];
}

export function CadastruWizard({ imobile, enums }: { imobile: ImobilOpt[]; enums: Enums }) {
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const keys = [
      "imobilId", "felInscriere", "descriereDrept",
      "actTip", "actNumar", "actData", "actEmitent",
      "modComunicare", "regimSolutionare", "scopExtras", "calitateSolicitant",
    ];
    const body = Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));
    const res = await fetch("/api/cadastru/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(
        b.error === "validare"
          ? "Verifică profilul, imobilul și câmpurile obligatorii: " + (b.fields ?? []).join(", ")
          : "Generare eșuată: " + (b.error ?? ""),
      );
      return;
    }
    setResult(await res.json());
  }

  if (imobile.length === 0) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Eveniment de viață</p>
          <h1 className="page-title">Cadastru / carte funciară</h1>
        </div>
        <div className="notice" data-testid="no-imobil">
          <span aria-hidden="true">🏠</span>
          <span>Adaugă întâi un imobil în „Imobilele mele”, apoi revino aici.</span>
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
          <ol className="steps" data-testid="cadastru-checklist">
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
        <h1 className="page-title">Înscriere în cartea funciară</h1>
        <p className="lead">Cererea de înscriere (Anexa 5) + o cerere de extras CF pentru pre-verificare. Datele tale și ale imobilului vin din profil.</p>
      </div>

      <div className="card card--pad">
        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label" htmlFor="cad-imobil">Imobil</label>
            <select id="cad-imobil" className="select" name="imobilId" required data-testid="imobilId">
              {imobile.map((im) => (
                <option key={im.id} value={im.id}>{im.label}</option>
              ))}
            </select>
          </div>

          <p className="section-label">Înscrierea</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cad-fel">Felul înscrierii</label>
              <select id="cad-fel" className="select" name="felInscriere" required data-testid="fel-inscriere">
                {enums.felInscriere.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cad-drept">Dreptul/faptul de înscris</label>
              <input id="cad-drept" className="input" name="descriereDrept" placeholder="drept de proprietate" required data-testid="descriere-drept" />
            </div>
          </div>

          <p className="section-label">Actul justificativ</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cad-acttip">Tip act</label>
              <input id="cad-acttip" className="input" name="actTip" placeholder="act notarial" required data-testid="act-tip" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cad-actnr">Număr act</label>
              <input id="cad-actnr" className="input input--mono" name="actNumar" required data-testid="act-numar" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cad-actdata">Data actului</label>
              <input id="cad-actdata" className="input input--mono" name="actData" placeholder="2026-05-10" required data-testid="act-data" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cad-actem">Emitent</label>
              <input id="cad-actem" className="input" name="actEmitent" placeholder="notar / instanță / autoritate" required data-testid="act-emitent" />
            </div>
          </div>

          <p className="section-label">Opțiuni</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cad-com">Comunicarea răspunsului</label>
              <select id="cad-com" className="select" name="modComunicare" required data-testid="mod-comunicare">
                {enums.modComunicare.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cad-regim">Regim de soluționare</label>
              <select id="cad-regim" className="select" name="regimSolutionare" data-testid="regim">
                {enums.regimSolutionare.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="cad-scop">Extras CF (pre-verificare)</label>
              <select id="cad-scop" className="select" name="scopExtras" required data-testid="scop-extras">
                {enums.scopExtras.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="cad-cal">Calitatea solicitantului</label>
              <select id="cad-cal" className="select" name="calitateSolicitant" data-testid="calitate">
                <option value="">—</option>
                {enums.calitateSolicitant.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
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
