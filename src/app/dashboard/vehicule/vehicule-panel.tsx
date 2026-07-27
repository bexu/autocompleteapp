"use client";

import { useState } from "react";

interface Vehicul {
  id: string;
  marca: string | null;
  model: string | null;
  nrInmatriculare: string | null;
  vin: string | null;
}

type Draft = {
  marca: string;
  model: string;
  nrInmatriculare: string;
  vin: string;
  normaPoluare: string;
  emisiiCo2GKm: string;
  putereKw: string;
  cilindreeCm3: string;
  combustibil: string;
};

const EMPTY_DRAFT: Draft = {
  marca: "",
  model: "",
  nrInmatriculare: "",
  vin: "",
  normaPoluare: "",
  emisiiCo2GKm: "",
  putereKw: "",
  cilindreeCm3: "",
  combustibil: "",
};

export function VehiculePanel({ initial }: { initial: Vehicul[] }) {
  const [vehicule, setVehicule] = useState(initial);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof Draft>(k: K, v: string) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function onCivUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    const fd = new FormData();
    fd.set("file", file);
    const res = await fetch("/api/vehicule/ocr", { method: "POST", body: fd });
    setBusy(false);
    if (!res.ok) {
      setError("Nu am putut citi CIV-ul. Completează manual.");
      return;
    }
    const { extracted } = await res.json();
    if (extracted?.source !== "civ") {
      setInfo("Nu am găsit date în CIV. Completează manual.");
      return;
    }
    // pre-completează câmpurile extrase (userul confirmă înainte de salvare)
    setDraft((d) => ({
      ...d,
      marca: extracted.marca ?? d.marca,
      model: extracted.model ?? d.model,
      nrInmatriculare: extracted.nrInmatriculare ?? d.nrInmatriculare,
      vin: extracted.vin ?? d.vin,
      normaPoluare: extracted.normaPoluare ?? d.normaPoluare,
      emisiiCo2GKm: extracted.emisiiCo2GKm != null ? String(extracted.emisiiCo2GKm) : d.emisiiCo2GKm,
      putereKw: extracted.putereKw != null ? String(extracted.putereKw) : d.putereKw,
      cilindreeCm3: extracted.cilindreeCm3 != null ? String(extracted.cilindreeCm3) : d.cilindreeCm3,
      combustibil: extracted.combustibil ?? d.combustibil,
    }));
    setInfo("Date extrase din CIV. Verifică și salvează.");
  }

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await fetch("/api/vehicule", {
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
    const { vehicul } = await res.json();
    setVehicule((v) => [vehicul, ...v]);
    setDraft(EMPTY_DRAFT);
    setInfo("Vehicul salvat.");
  }

  async function onDelete(id: string) {
    setBusy(true);
    const res = await fetch(`/api/vehicule/${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) setVehicule((v) => v.filter((x) => x.id !== id));
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Vehicule</p>
        <h1 className="page-title">Vehiculele mele</h1>
        <p className="lead">Datele intră în formularele auto (ITL, DGPCI).</p>
      </div>

      <ul className="list" data-testid="vehicule-list" style={{ marginBottom: "1.6rem" }}>
        {vehicule.length === 0 && (
          <li className="muted" style={{ fontSize: "var(--fs-sm)" }}>
            Niciun vehicul încă.
          </li>
        )}
        {vehicule.map((v) => (
          <li key={v.id} className="list__item" data-testid={`vehicul-${v.id}`}>
            <span className="list__main">
              <strong>{v.marca} {v.model}</strong>{" "}
              <span className="mono muted" style={{ fontSize: "var(--fs-sm)" }}>
                {v.nrInmatriculare || v.vin || "fără nr."}
              </span>
            </span>
            <button type="button" className="btn btn--danger btn--sm" onClick={() => onDelete(v.id)} disabled={busy} data-testid={`del-${v.id}`}>
              șterge
            </button>
          </li>
        ))}
      </ul>

      <div className="card card--pad">
        <p className="section-label" style={{ marginTop: 0 }}>Adaugă vehicul</p>
        <div className="notice" style={{ marginBottom: "1.1rem" }}>
          <span aria-hidden="true">📄</span>
          <label>
            Ai certificatul de înmatriculare (CIV)? Încarcă-l ca să pre-completăm câmpurile:{" "}
            <input type="file" onChange={onCivUpload} disabled={busy} data-testid="civ-file" />
          </label>
        </div>

        <form onSubmit={onAdd} className="form">
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Marcă</label>
              <input className="input" value={draft.marca} onChange={(e) => set("marca", e.target.value)} placeholder="BMW" data-testid="v-marca" />
            </div>
            <div className="field">
              <label className="field__label">Model</label>
              <input className="input" value={draft.model} onChange={(e) => set("model", e.target.value)} placeholder="320d" data-testid="v-model" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Nr. înmatriculare</label>
              <input className="input input--mono" value={draft.nrInmatriculare} onChange={(e) => set("nrInmatriculare", e.target.value)} placeholder="CJ 12 ABC" data-testid="v-nr" />
            </div>
            <div className="field">
              <label className="field__label">VIN</label>
              <input className="input input--mono" value={draft.vin} onChange={(e) => set("vin", e.target.value)} placeholder="17 caractere" data-testid="v-vin" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Normă poluare</label>
              <input className="input" value={draft.normaPoluare} onChange={(e) => set("normaPoluare", e.target.value)} placeholder="Euro 6" data-testid="v-norma" />
            </div>
            <div className="field">
              <label className="field__label">Emisii CO₂ (g/km)</label>
              <input className="input input--mono" value={draft.emisiiCo2GKm} onChange={(e) => set("emisiiCo2GKm", e.target.value)} placeholder="120" data-testid="v-co2" />
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label">Putere (kW)</label>
              <input className="input input--mono" value={draft.putereKw} onChange={(e) => set("putereKw", e.target.value)} placeholder="140" data-testid="v-putere" />
            </div>
            <div className="field">
              <label className="field__label">Cilindree (cm³)</label>
              <input className="input input--mono" value={draft.cilindreeCm3} onChange={(e) => set("cilindreeCm3", e.target.value)} placeholder="1995" data-testid="v-cilindree" />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Combustibil</label>
            <select className="select" value={draft.combustibil} onChange={(e) => set("combustibil", e.target.value)} data-testid="v-combustibil">
              <option value="">Alege...</option>
              <option value="BENZINA">Benzină</option>
              <option value="MOTORINA">Motorină</option>
              <option value="HIBRID">Hibrid</option>
              <option value="ELECTRIC">Electric</option>
              <option value="GPL">GPL</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={busy} data-testid="v-add">
              {busy ? "..." : "Adaugă"}
            </button>
            {info && <span data-testid="info" className="pill pill--ok">{info}</span>}
          </div>
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
