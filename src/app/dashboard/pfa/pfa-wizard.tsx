"use client";

import { useState } from "react";

interface FormResult {
  formCode: string;
  title: string;
  dossierId: string;
}

interface CaseResult {
  event: string;
  label: string;
  checklist: string[];
  forms: FormResult[];
}

interface Enums {
  tipEntitate: readonly string[];
  dovadaSpatiu: readonly string[];
  daNu: readonly string[];
  tipMentiune: readonly string[];
  motivRadiere: readonly string[];
  modEliberare: readonly string[];
}

const INFIINTARE_KEYS = [
  "tipEntitate", "denumirePropusa", "denumireVarianta2", "denumireVarianta3", "judetSediu",
  "sediuLocalitate", "sediuStrada", "sediuNumar", "sediuDetalii",
  "dovadaSpatiuTip", "codCaenPrincipal", "descriereCaenPrincipal", "coduriCaenSecundare",
  "dataInceput", "optiuneTva",
];
const MENTIUNE_KEYS = [
  "denumirePfa", "nrOrdineRegistru", "cui", "orctJudet", "tipMentiune",
  "noulSediu", "coduriCaenAdaugate", "coduriCaenEliminate",
  "dataSuspendarePanaLa", "dataReluare", "motivRadiere", "modEliberare",
];

export function PfaWizard({ enums }: { enums: Enums }) {
  const [event, setEvent] = useState<"INFIINTARE" | "MENTIUNE">("INFIINTARE");
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const keys = event === "INFIINTARE" ? INFIINTARE_KEYS : MENTIUNE_KEYS;
    const body: Record<string, string> = { event };
    for (const k of keys) body[k] = String(fd.get(k) ?? "");
    const res = await fetch("/api/pfa/generate", {
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
          <ol className="steps" data-testid="pfa-checklist">
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
        <h1 className="page-title">PFA la ONRC</h1>
        <p className="lead">Înființare (rezervare denumire + înregistrare) sau o mențiune (schimbare/suspendare/reluare/radiere). Datele de identitate vin din profil.</p>
      </div>

      <div className="card card--pad">
        <div className="row" style={{ gap: "1.2rem", marginBottom: "1.1rem" }}>
          <label className="row" style={{ gap: "0.5rem" }}>
            <input type="radio" checked={event === "INFIINTARE"} onChange={() => setEvent("INFIINTARE")} data-testid="ev-infiintare" style={{ accentColor: "var(--accent)" }} />
            Îmi deschid un PFA
          </label>
          <label className="row" style={{ gap: "0.5rem" }}>
            <input type="radio" checked={event === "MENTIUNE"} onChange={() => setEvent("MENTIUNE")} data-testid="ev-mentiune" style={{ accentColor: "var(--accent)" }} />
            Modific / închid un PFA
          </label>
        </div>

        <form onSubmit={onSubmit} className="form">
          {event === "INFIINTARE" && (
            <>
              <p className="section-label" style={{ marginTop: 0 }}>Rezervare denumire</p>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-tip">Forma de organizare</label>
                  <select id="p-tip" className="select" name="tipEntitate" required data-testid="tip-entitate">
                    {enums.tipEntitate.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-den">Denumire propusă (opțiunea 1)</label>
                  <input id="p-den" className="input" name="denumirePropusa" placeholder="Popescu Ion PFA" required data-testid="denumire-propusa" />
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="p-judet">Județul sediului profesional</label>
                <input id="p-judet" className="input" name="judetSediu" required data-testid="judet-sediu" />
              </div>

              <p className="section-label">Înregistrare</p>
              <p className="muted" style={{ fontSize: "var(--fs-sm)", marginTop: "-0.3rem" }}>
                Județul sediului e cel completat mai sus (determină ORCT-ul competent).
              </p>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-sloc">Sediu — localitate</label>
                  <input id="p-sloc" className="input" name="sediuLocalitate" required data-testid="sediu-localitate" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-sstr">Sediu — stradă</label>
                  <input id="p-sstr" className="input" name="sediuStrada" required data-testid="sediu-strada" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-snr">Sediu — număr</label>
                  <input id="p-snr" className="input" name="sediuNumar" required data-testid="sediu-numar" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-sdet">Bloc/scară/etaj/ap. <span className="muted">(opțional)</span></label>
                  <input id="p-sdet" className="input" name="sediuDetalii" data-testid="sediu-detalii" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-dov">Dovada dreptului de folosință</label>
                  <select id="p-dov" className="select" name="dovadaSpatiuTip" required data-testid="dovada-spatiu">
                    {enums.dovadaSpatiu.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-caen">Cod CAEN principal (4 cifre)</label>
                  <input id="p-caen" className="input input--mono" name="codCaenPrincipal" placeholder="6201" required data-testid="caen-principal" />
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="p-caend">Descrierea activității principale</label>
                <input id="p-caend" className="input" name="descriereCaenPrincipal" required data-testid="descriere-caen" />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-caens">Coduri CAEN secundare <span className="muted">(opțional)</span></label>
                  <input id="p-caens" className="input input--mono" name="coduriCaenSecundare" placeholder="6202, 6209" data-testid="caen-secundare" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-data">Data începerii activității</label>
                  <input id="p-data" className="input input--mono" name="dataInceput" placeholder="2026-09-01" required data-testid="data-inceput" />
                </div>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="p-tva">Înregistrare în scopuri de TVA</label>
                <select id="p-tva" className="select" name="optiuneTva" data-testid="optiune-tva">
                  <option value="">—</option>
                  {enums.daNu.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </>
          )}

          {event === "MENTIUNE" && (
            <>
              <p className="section-label" style={{ marginTop: 0 }}>PFA existentă</p>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-mden">Denumirea PFA</label>
                  <input id="p-mden" className="input" name="denumirePfa" placeholder="Popescu Ion PFA" required data-testid="denumire-pfa" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-mnr">Nr. ordine registru</label>
                  <input id="p-mnr" className="input input--mono" name="nrOrdineRegistru" placeholder="F40/1234/2020" required data-testid="nr-ordine" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-mcui">CUI</label>
                  <input id="p-mcui" className="input input--mono" name="cui" required data-testid="cui" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-morct">Județul ORCT</label>
                  <input id="p-morct" className="input" name="orctJudet" required data-testid="orct-judet" />
                </div>
              </div>

              <p className="section-label">Mențiunea</p>
              <div className="field">
                <label className="field__label" htmlFor="p-mtip">Tipul mențiunii</label>
                <select id="p-mtip" className="select" name="tipMentiune" required data-testid="tip-mentiune">
                  {enums.tipMentiune.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field__label" htmlFor="p-mnou">Schimbare sediu — noua adresă <span className="muted">(dacă e cazul)</span></label>
                <input id="p-mnou" className="input" name="noulSediu" data-testid="noul-sediu" />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-madd">CAEN de adăugat <span className="muted">(opțional)</span></label>
                  <input id="p-madd" className="input input--mono" name="coduriCaenAdaugate" data-testid="caen-adaugate" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-mdel">CAEN de eliminat <span className="muted">(opțional)</span></label>
                  <input id="p-mdel" className="input input--mono" name="coduriCaenEliminate" data-testid="caen-eliminate" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-msusp">Suspendare — până la <span className="muted">(opțional)</span></label>
                  <input id="p-msusp" className="input input--mono" name="dataSuspendarePanaLa" placeholder="2027-09-01" data-testid="data-suspendare" />
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-mrel">Reluare — data <span className="muted">(opțional)</span></label>
                  <input id="p-mrel" className="input input--mono" name="dataReluare" data-testid="data-reluare" />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label className="field__label" htmlFor="p-mradm">Radiere — motiv <span className="muted">(opțional)</span></label>
                  <select id="p-mradm" className="select" name="motivRadiere" data-testid="motiv-radiere">
                    <option value="">—</option>
                    {enums.motivRadiere.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label className="field__label" htmlFor="p-mmod">Modul de eliberare</label>
                  <select id="p-mmod" className="select" name="modEliberare" required data-testid="mod-eliberare">
                    {enums.modEliberare.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
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
