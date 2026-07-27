"use client";

import { useState } from "react";

interface ImobilOpt {
  id: string;
  label: string;
}
interface Field {
  key: string;
  label: string;
  value: string;
}

export function C168Form({ imobile }: { imobile: ImobilOpt[] }) {
  const [preview, setPreview] = useState<Field[] | null>(null);
  const [body, setBody] = useState<Record<string, unknown> | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function readBody(form: FormData): Record<string, unknown> {
    return {
      imobilId: String(form.get("imobilId") ?? ""),
      tipOperatiune: String(form.get("tipOperatiune") ?? ""),
      chiriasNume: String(form.get("chiriasNume") ?? ""),
      chiriasCnp: String(form.get("chiriasCnp") ?? ""),
      chirie: String(form.get("chirie") ?? ""),
      moneda: String(form.get("moneda") ?? ""),
      perioadaStart: String(form.get("perioadaStart") ?? ""),
      perioadaEnd: String(form.get("perioadaEnd") ?? ""),
      dataContract: String(form.get("dataContract") ?? ""),
    };
  }

  async function onPreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = readBody(new FormData(e.currentTarget));
    const res = await fetch("/api/forms/c168/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(
        (b.fields ?? []).some((f: string) => ["locatorCnp", "locatorNume"].includes(f))
          ? "Completează-ți întâi profilul (nume, CNP)."
          : "Date invalide: " + ((b.fields ?? []).join(", ") || "verifică câmpurile"),
      );
      return;
    }
    setBody(data);
    setPreview((await res.json()).fields);
  }

  async function onGenerate() {
    if (!body) return;
    setError(null);
    setBusy(true);
    const res = await fetch("/api/forms/c168/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Generare eșuată.");
      return;
    }
    setDossierId(res.headers.get("X-Dossier-Id"));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "c168.pdf";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (imobile.length === 0) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Închiriere</p>
          <h1 className="page-title">Contract de închiriere (C168)</h1>
        </div>
        <div className="notice" data-testid="no-imobil">
          <span aria-hidden="true">🏠</span>
          <span>Adaugă întâi un imobil în „Imobilele mele”, apoi revino aici.</span>
        </div>
      </main>
    );
  }

  if (preview) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">C168 · pas 2 din 2</p>
          <h1 className="page-title">Exact ce declari</h1>
          <p className="lead">Verifică datele. Depui în SPV pe propria răspundere.</p>
        </div>
        <div className="card card--pad">
          <table data-testid="preview" className="kv">
            <tbody>
              {preview.map((f) => (
                <tr key={f.key}>
                  <td>{f.label}</td>
                  <td data-testid={`pv-${f.key}`}>{f.value || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="form-actions" style={{ marginTop: "1.1rem" }}>
            <button type="button" className="btn btn--ghost" onClick={() => setPreview(null)} data-testid="inapoi">
              Înapoi
            </button>
            <button type="button" className="btn btn--primary" onClick={onGenerate} disabled={busy} data-testid="c168-genereaza">
              {busy ? "Se generează..." : "Generează și arhivează"}
            </button>
          </div>
          {dossierId && (
            <p data-testid="c168-generat" className="alert alert--ok" style={{ marginTop: "1rem" }}>
              Generat, arhivat și descărcat.{" "}
              <a href={`/dashboard/dosare/${dossierId}`} data-testid="c168-vezi-dosar">
                Vezi pașii de depunere →
              </a>
            </p>
          )}
          {error && <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "1rem" }}>{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Contract de locațiune · pas 1 din 2</p>
        <h1 className="page-title">Contract de închiriere (C168)</h1>
        <p className="lead">Datele tale vin din profil, imobilul din „Imobilele mele”. Adaugă termenii contractului.</p>
      </div>
      <div className="card card--pad">
        <form onSubmit={onPreview} className="form">
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="c-imobil">Imobil</label>
              <select id="c-imobil" className="select" name="imobilId" required data-testid="c168-imobil">
                {imobile.map((im) => (
                  <option key={im.id} value={im.id}>{im.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="c-tip">Operațiune</label>
              <select id="c-tip" className="select" name="tipOperatiune" required data-testid="c168-tip">
                <option value="Înregistrare">Înregistrare</option>
                <option value="Modificare">Modificare</option>
                <option value="Încetare">Încetare</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="c-cnume">Chiriaș — nume</label>
              <input id="c-cnume" className="input" name="chiriasNume" placeholder="Nume complet" required data-testid="c168-chirias-nume" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="c-ccnp">Chiriaș — CNP/CIF</label>
              <input id="c-ccnp" className="input input--mono" name="chiriasCnp" placeholder="13 cifre" required data-testid="c168-chirias-cnp" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="c-chirie">Chirie</label>
              <input id="c-chirie" className="input input--mono" name="chirie" placeholder="1500" required data-testid="c168-chirie" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="c-moneda">Monedă</label>
              <select id="c-moneda" className="select" name="moneda" required data-testid="c168-moneda">
                <option value="RON">RON</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="c-start">De la data</label>
              <input id="c-start" className="input input--mono" name="perioadaStart" placeholder="2026-08-01" required data-testid="c168-start" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="c-end">Până la data</label>
              <input id="c-end" className="input input--mono" name="perioadaEnd" placeholder="2027-08-01" data-testid="c168-end" />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="c-data">Data contractului</label>
            <input id="c-data" className="input input--mono" name="dataContract" placeholder="2026-07-27" required data-testid="c168-data" />
          </div>
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="c168-previzualizeaza">
            {busy ? "Se procesează..." : "Previzualizează"}
          </button>
        </form>
        {error && <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>{error}</p>}
      </div>
    </main>
  );
}
