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
    <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Vehiculele mele</h1>

      <ul data-testid="vehicule-list">
        {vehicule.map((v) => (
          <li key={v.id} data-testid={`vehicul-${v.id}`}>
            {v.marca} {v.model} — {v.nrInmatriculare || v.vin || "fără nr."}{" "}
            <button type="button" onClick={() => onDelete(v.id)} disabled={busy} data-testid={`del-${v.id}`}>
              șterge
            </button>
          </li>
        ))}
      </ul>

      <h2>Adaugă vehicul</h2>
      <p>
        <label>
          Încarcă CIV (pre-completează){" "}
          <input type="file" onChange={onCivUpload} disabled={busy} data-testid="civ-file" />
        </label>
      </p>

      <form onSubmit={onAdd} style={{ display: "grid", gap: 8 }}>
        <input value={draft.marca} onChange={(e) => set("marca", e.target.value)} placeholder="Marcă" data-testid="v-marca" />
        <input value={draft.model} onChange={(e) => set("model", e.target.value)} placeholder="Model" data-testid="v-model" />
        <input value={draft.nrInmatriculare} onChange={(e) => set("nrInmatriculare", e.target.value)} placeholder="Nr. înmatriculare" data-testid="v-nr" />
        <input value={draft.vin} onChange={(e) => set("vin", e.target.value)} placeholder="VIN (17 caractere)" data-testid="v-vin" />
        <input value={draft.normaPoluare} onChange={(e) => set("normaPoluare", e.target.value)} placeholder="Normă poluare" data-testid="v-norma" />
        <input value={draft.emisiiCo2GKm} onChange={(e) => set("emisiiCo2GKm", e.target.value)} placeholder="Emisii CO2 (g/km)" data-testid="v-co2" />
        <input value={draft.putereKw} onChange={(e) => set("putereKw", e.target.value)} placeholder="Putere (kW)" data-testid="v-putere" />
        <input value={draft.cilindreeCm3} onChange={(e) => set("cilindreeCm3", e.target.value)} placeholder="Cilindree (cm³)" data-testid="v-cilindree" />
        <select value={draft.combustibil} onChange={(e) => set("combustibil", e.target.value)} data-testid="v-combustibil">
          <option value="">Combustibil...</option>
          <option value="BENZINA">Benzină</option>
          <option value="MOTORINA">Motorină</option>
          <option value="HIBRID">Hibrid</option>
          <option value="ELECTRIC">Electric</option>
          <option value="GPL">GPL</option>
        </select>
        <button type="submit" disabled={busy} data-testid="v-add">
          {busy ? "..." : "Adaugă"}
        </button>
      </form>
      {info && <p data-testid="info" style={{ color: "green" }}>{info}</p>}
      {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
