"use client";

import { useState } from "react";

interface ImobilOpt {
  id: string;
  tip: string;
  label: string;
}
interface Field {
  key: string;
  label: string;
  value: string;
}

// Clădire (ITL-001) sau teren (ITL-003), sugerat după tipul imobilului.
function suggestForm(tip: string): "ITL-001" | "ITL-003" {
  return tip === "TEREN" ? "ITL-003" : "ITL-001";
}

export function ImpozitForm({ imobile }: { imobile: ImobilOpt[] }) {
  const [imobilId, setImobilId] = useState(imobile[0]?.id ?? "");
  const [formCode, setFormCode] = useState<"ITL-001" | "ITL-003">(
    suggestForm(imobile[0]?.tip ?? "APARTAMENT"),
  );
  const [preview, setPreview] = useState<Field[] | null>(null);
  const [body, setBody] = useState<Record<string, unknown> | null>(null);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onImobilChange(id: string) {
    setImobilId(id);
    const tip = imobile.find((im) => im.id === id)?.tip ?? "APARTAMENT";
    setFormCode(suggestForm(tip));
  }

  function readBody(form: FormData): Record<string, unknown> {
    return {
      formCode,
      imobilId,
      dataDobandire: String(form.get("dataDobandire") ?? ""),
      cotaParte: String(form.get("cotaParte") ?? ""),
      valoareImpozabila: String(form.get("valoareImpozabila") ?? ""),
      categoriaFolosinta: String(form.get("categoriaFolosinta") ?? ""),
    };
  }

  async function onPreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = readBody(new FormData(e.currentTarget));
    const res = await fetch("/api/forms/impozit/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(
        (b.fields ?? []).includes("cnp")
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
    const res = await fetch("/api/forms/impozit/generate", {
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
    a.download = `${formCode.toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (imobile.length === 0) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Impozit local</p>
          <h1 className="page-title">Declarare imobil la taxe locale</h1>
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
          <p className="eyebrow">{formCode} · pas 2 din 2</p>
          <h1 className="page-title">Exact ce declari</h1>
          <p className="lead">Verifică datele. Depui la taxe locale pe propria răspundere.</p>
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
            <button type="button" className="btn btn--primary" onClick={onGenerate} disabled={busy} data-testid="impozit-genereaza">
              {busy ? "Se generează..." : "Generează și arhivează"}
            </button>
          </div>
          {dossierId && (
            <p data-testid="impozit-generat" className="alert alert--ok" style={{ marginTop: "1rem" }}>
              Generat, arhivat și descărcat.{" "}
              <a href={`/dashboard/dosare/${dossierId}`} data-testid="impozit-vezi-dosar">
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
        <p className="eyebrow">Impozit local · pas 1 din 2</p>
        <h1 className="page-title">Declarare imobil la taxe locale</h1>
        <p className="lead">Datele tale vin din profil, imobilul din „Imobilele mele”. Adaugă datele de dobândire.</p>
      </div>
      <div className="card card--pad">
        <form onSubmit={onPreview} className="form">
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="i-imobil">Imobil</label>
              <select id="i-imobil" className="select" value={imobilId} onChange={(e) => onImobilChange(e.target.value)} data-testid="impozit-imobil">
                {imobile.map((im) => (
                  <option key={im.id} value={im.id}>{im.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="i-form">Formular</label>
              <select id="i-form" className="select" value={formCode} onChange={(e) => setFormCode(e.target.value as "ITL-001" | "ITL-003")} data-testid="impozit-form">
                <option value="ITL-001">Clădire (ITL-001)</option>
                <option value="ITL-003">Teren (ITL-003)</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="i-data">Data dobândirii</label>
              <input id="i-data" className="input input--mono" name="dataDobandire" placeholder="2026-03-01" required data-testid="impozit-data" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="i-cota">Cotă-parte</label>
              <input id="i-cota" className="input input--mono" name="cotaParte" placeholder="1/1" data-testid="impozit-cota" />
            </div>
          </div>
          {formCode === "ITL-001" ? (
            <div className="field">
              <label className="field__label" htmlFor="i-val">Valoare impozabilă (lei)</label>
              <input id="i-val" className="input input--mono" name="valoareImpozabila" placeholder="250000" data-testid="impozit-valoare" />
            </div>
          ) : (
            <div className="field">
              <label className="field__label" htmlFor="i-cat">Categoria de folosință</label>
              <input id="i-cat" className="input" name="categoriaFolosinta" placeholder="curți-construcții" required data-testid="impozit-categorie" />
            </div>
          )}
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="impozit-previzualizeaza">
            {busy ? "Se procesează..." : "Previzualizează"}
          </button>
        </form>
        {error && <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>{error}</p>}
      </div>
    </main>
  );
}
