"use client";

import { useState } from "react";
import { apiErrorItems, apiErrorTitle, type ApiErrorBody } from "@/lib/forms/error-text";

interface ImobilOpt { id: string; label: string; }
interface FormResult { formCode: string; title: string; dossierId: string; }
interface CaseResult { event: string; label: string; checklist: string[]; forms: FormResult[]; }
interface Enums {
  scopCertificat: readonly string[];
  tipObiect: readonly string[];
  tipLucrare: readonly string[];
}

const CERT_KEYS = ["scopSolicitare", "tipObiectImobil", "descriereScop"];
const AUT_KEYS = ["tipLucrare", "descriereLucrare", "valoareLucrari", "certificatUrbanismNumar", "certificatUrbanismData", "proiectant", "durataExecutieLuni"];

export function UrbanismWizard({ imobile, enums }: { imobile: ImobilOpt[]; enums: Enums }) {
  const [event, setEvent] = useState<"CERTIFICAT" | "AUTORIZATIE">("CERTIFICAT");
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<{ title: string; items: string[] } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const keys = event === "CERTIFICAT" ? CERT_KEYS : AUT_KEYS;
    const body: Record<string, string> = { event, imobilId: String(fd.get("imobilId") ?? "") };
    for (const k of keys) body[k] = String(fd.get(k) ?? "");
    const res = await fetch("/api/urbanism/generate", {
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

  if (imobile.length === 0) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Eveniment de viață</p>
          <h1 className="page-title">Urbanism / construcții</h1>
        </div>
        <div className="notice" data-testid="no-imobil">
          <span aria-hidden="true">🏗️</span>
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
          <ol className="steps" data-testid="urbanism-checklist">
            {result.checklist.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Eveniment de viață</p>
        <h1 className="page-title">Urbanism / construcții</h1>
        <p className="lead">Certificat de urbanism (act prealabil) sau autorizație de construire/desființare. Datele tale și ale imobilului vin din profil.</p>
      </div>

      <div className="card card--pad">
        <div className="row" style={{ gap: "1.2rem", marginBottom: "1.1rem" }}>
          <label className="row" style={{ gap: "0.5rem" }}>
            <input type="radio" checked={event === "CERTIFICAT"} onChange={() => setEvent("CERTIFICAT")} data-testid="ev-certificat" style={{ accentColor: "var(--accent)" }} />
            Certificat de urbanism
          </label>
          <label className="row" style={{ gap: "0.5rem" }}>
            <input type="radio" checked={event === "AUTORIZATIE"} onChange={() => setEvent("AUTORIZATIE")} data-testid="ev-autorizatie" style={{ accentColor: "var(--accent)" }} />
            Autorizație de construire
          </label>
        </div>

        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="field__label" htmlFor="u-imobil">Imobil</label>
            <select id="u-imobil" className="select" name="imobilId" required data-testid="imobilId">
              {imobile.map((im) => <option key={im.id} value={im.id}>{im.label}</option>)}
            </select>
          </div>

          {event === "CERTIFICAT" && (
            <>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="u-scop">Scopul solicitării</label>
                  <select id="u-scop" className="select" name="scopSolicitare" required data-testid="scop-solicitare">
                    {enums.scopCertificat.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="u-obiect">Imobilul vizat</label>
                  <select id="u-obiect" className="select" name="tipObiectImobil" required data-testid="tip-obiect">
                    {enums.tipObiect.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="u-descs">Descrierea scopului/lucrării</label>
                <textarea id="u-descs" className="input" name="descriereScop" rows={3} required data-testid="descriere-scop" />
              </div>
            </>
          )}

          {event === "AUTORIZATIE" && (
            <>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="u-tipl">Tipul lucrării</label>
                  <select id="u-tipl" className="select" name="tipLucrare" required data-testid="tip-lucrare">
                    {enums.tipLucrare.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="u-val">Valoarea lucrărilor (lei)</label>
                  <input id="u-val" className="input input--mono" name="valoareLucrari" inputMode="decimal" placeholder="150000" required data-testid="valoare-lucrari" />
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="u-descl">Denumirea și descrierea lucrărilor</label>
                <textarea id="u-descl" className="input" name="descriereLucrare" rows={3} required data-testid="descriere-lucrare" />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="u-cnr">Certificat urbanism — nr.</label>
                  <input id="u-cnr" className="input input--mono" name="certificatUrbanismNumar" required data-testid="cert-numar" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="u-cdata">Certificat urbanism — dată</label>
                  <input id="u-cdata" type="date" className="input input--mono" name="certificatUrbanismData" required data-testid="cert-data" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="u-proi">Proiectant</label>
                  <input id="u-proi" className="input" name="proiectant" placeholder="arhitect / firmă cu drept de semnătură" required data-testid="proiectant" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="u-dur">Durata execuției (luni) <span className="muted">(opțional)</span></label>
                  <input id="u-dur" className="input input--mono" name="durataExecutieLuni" inputMode="numeric" maxLength={3} placeholder="12" data-testid="durata" />
                </div>
              </div>
            </>
          )}

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
