"use client";

import { useState } from "react";

interface Imobil {
  id: string;
  tip: string;
  localitate: string | null;
  strada: string | null;
  nrCadastral: string | null;
}

type Draft = {
  tip: string;
  judet: string;
  localitate: string;
  strada: string;
  nr: string;
  suprafataMp: string;
  nrCadastral: string;
  nrCarteFunciara: string;
};

const EMPTY: Draft = {
  tip: "APARTAMENT",
  judet: "",
  localitate: "",
  strada: "",
  nr: "",
  suprafataMp: "",
  nrCadastral: "",
  nrCarteFunciara: "",
};

export function ImobilePanel({ initial }: { initial: Imobil[] }) {
  const [imobile, setImobile] = useState(initial);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Draft>(k: K, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/imobile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError("Date invalide: " + ((b.fields ?? []).join(", ") || "verifică câmpurile"));
      return;
    }
    const { imobil } = await res.json();
    setImobile((v) => [imobil, ...v]);
    setDraft(EMPTY);
  }

  async function onDelete(id: string) {
    setBusy(true);
    const res = await fetch(`/api/imobile/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) setImobile((v) => v.filter((x) => x.id !== id));
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Proprietăți</p>
        <h1 className="page-title">Imobilele mele</h1>
        <p className="lead">Datele intră în formularele de închiriere (C168) și impozit local.</p>
      </div>

      <ul className="list" data-testid="imobile-list" style={{ marginBottom: "1.6rem" }}>
        {imobile.length === 0 && (
          <li className="muted" style={{ fontSize: "var(--fs-sm)" }}>Niciun imobil încă.</li>
        )}
        {imobile.map((im) => (
          <li key={im.id} className="list__item" data-testid={`imobil-${im.id}`}>
            <span className="list__main">
              <strong>{im.tip}</strong>{" "}
              <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>
                {[im.strada, im.localitate].filter(Boolean).join(", ") || im.nrCadastral || "fără adresă"}
              </span>
            </span>
            <button type="button" className="btn btn--danger btn--sm" onClick={() => onDelete(im.id)} disabled={busy} data-testid={`del-${im.id}`}>
              șterge
            </button>
          </li>
        ))}
      </ul>

      <div className="card card--pad">
        <p className="section-label" style={{ marginTop: 0 }}>Adaugă imobil</p>
        <form onSubmit={onAdd} className="form">
          <div className="field">
            <label className="field__label">Tip</label>
            <select className="select" value={draft.tip} onChange={(e) => set("tip", e.target.value)} data-testid="im-tip">
              <option value="APARTAMENT">Apartament</option>
              <option value="CASA">Casă</option>
              <option value="TEREN">Teren</option>
              <option value="SPATIU_COMERCIAL">Spațiu comercial</option>
              <option value="ALTUL">Altul</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Județ</label>
              <input className="input" value={draft.judet} onChange={(e) => set("judet", e.target.value)} placeholder="Cluj" data-testid="im-judet" />
            </div>
            <div className="field">
              <label className="field__label">Localitate</label>
              <input className="input" value={draft.localitate} onChange={(e) => set("localitate", e.target.value)} placeholder="Cluj-Napoca" data-testid="im-localitate" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Stradă</label>
              <input className="input" value={draft.strada} onChange={(e) => set("strada", e.target.value)} placeholder="Memorandumului" data-testid="im-strada" />
            </div>
            <div className="field">
              <label className="field__label">Număr</label>
              <input className="input" value={draft.nr} onChange={(e) => set("nr", e.target.value)} placeholder="10" data-testid="im-nr" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Suprafață (mp)</label>
              <input className="input input--mono" value={draft.suprafataMp} onChange={(e) => set("suprafataMp", e.target.value)} placeholder="65" data-testid="im-suprafata" />
            </div>
            <div className="field">
              <label className="field__label">Nr. cadastral</label>
              <input className="input input--mono" value={draft.nrCadastral} onChange={(e) => set("nrCadastral", e.target.value)} placeholder="12345" data-testid="im-cadastral" />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Nr. carte funciară</label>
            <input className="input input--mono" value={draft.nrCarteFunciara} onChange={(e) => set("nrCarteFunciara", e.target.value)} placeholder="CF 12345" data-testid="im-cf" />
          </div>
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="im-add">
            {busy ? "..." : "Adaugă"}
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
