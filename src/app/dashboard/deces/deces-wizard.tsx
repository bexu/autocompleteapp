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

interface Enums {
  decedatCalitate: readonly string[];
  calitateSolicitant: readonly string[];
  modalitatePlata: readonly string[];
  calitateUrmas: readonly string[];
  cauzaDeces: readonly string[];
}

export function DecesWizard({ enums }: { enums: Enums }) {
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<{ title: string; items: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const keys = [
      "decedatNume", "decedatCnp", "dataDeces", "decedatCalitate", "decedatDosarPensie",
      "certificatDecesNumar", "certificatDecesData", "certificatDecesEmitent",
      "calitateSolicitant", "modalitatePlata", "casaPensiiAjutor",
      "calitateUrmas", "titulariUrmasi", "cauzaDeces", "casaPensiiUrmas",
    ];
    const body = Object.fromEntries(keys.map((k) => [k, String(fd.get(k) ?? "")]));
    const res = await fetch("/api/deces/generate", {
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
          <ol className="steps" data-testid="deces-checklist">
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
        <h1 className="page-title">Deces în familie</h1>
        <p className="lead">Generăm cererea de ajutor de deces (Anexa 11) și cererea de pensie de urmaș (Anexa 7). Datele tale vin din profil.</p>
      </div>

      <div className="card card--pad">
        <form onSubmit={onSubmit} className="form">
          <p className="section-label" style={{ marginTop: 0 }}>Persoana decedată</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="d-nume">Nume și prenume</label>
              <input id="d-nume" className="input" name="decedatNume" required data-testid="decedat-nume" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="d-cnp">CNP decedat</label>
              <input id="d-cnp" className="input input--mono" name="decedatCnp" inputMode="numeric" maxLength={13} pattern="\d{13}" required data-testid="decedat-cnp" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="d-data">Data decesului</label>
              <input id="d-data" type="date" className="input input--mono" name="dataDeces" required data-testid="data-deces" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="d-cal">Calitatea decedatului</label>
              <select id="d-cal" className="select" name="decedatCalitate" required data-testid="decedat-calitate">
                {enums.decedatCalitate.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-dosar">Nr. dosar de pensie al decedatului <span className="muted">(dacă era pensionar)</span></label>
            <input id="d-dosar" className="input input--mono" name="decedatDosarPensie" data-testid="decedat-dosar" />
          </div>

          <p className="section-label">Certificatul de deces</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="d-cnr">Serie/număr</label>
              <input id="d-cnr" className="input" name="certificatDecesNumar" required data-testid="cert-numar" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="d-cdata">Data eliberării</label>
              <input id="d-cdata" type="date" className="input input--mono" name="certificatDecesData" required data-testid="cert-data" />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-cem">Emitent (primăria)</label>
            <input id="d-cem" className="input" name="certificatDecesEmitent" required data-testid="cert-emitent" />
          </div>

          <p className="section-label">Ajutor de deces</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="d-solcal">Calitatea ta față de decedat</label>
              <select id="d-solcal" className="select" name="calitateSolicitant" required data-testid="calitate-solicitant">
                {enums.calitateSolicitant.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="d-plata">Modalitatea de plată</label>
              <select id="d-plata" className="select" name="modalitatePlata" required data-testid="modalitate-plata">
                {enums.modalitatePlata.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-casa">Casa de pensii — domiciliul decedatului</label>
            <input id="d-casa" className="input" name="casaPensiiAjutor" placeholder="Casa Județeană de Pensii ..." required data-testid="casa-ajutor" />
          </div>

          <p className="section-label">Pensie de urmaș</p>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="d-urmcal">Calitatea ta de urmaș</label>
              <select id="d-urmcal" className="select" name="calitateUrmas" required data-testid="calitate-urmas">
                {enums.calitateUrmas.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="d-cauza">Cauza decesului <span className="muted">(opțional)</span></label>
              <select id="d-cauza" className="select" name="cauzaDeces" data-testid="cauza-deces">
                <option value="">—</option>
                {enums.cauzaDeces.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-titulari">Urmași (titulari) pentru care se solicită pensia</label>
            <input id="d-titulari" className="input" name="titulariUrmasi" placeholder="nume și calitate" required data-testid="titulari-urmasi" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="d-casau">Casa de pensii — domiciliul tău (solicitant)</label>
            <input id="d-casau" className="input" name="casaPensiiUrmas" placeholder="Casa Județeană de Pensii ..." required data-testid="casa-urmas" />
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
