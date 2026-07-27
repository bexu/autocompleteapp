"use client";

import { useState } from "react";

interface Vehicul {
  id: string;
  marca: string | null;
  model: string | null;
  nrInmatriculare: string | null;
  vin: string | null;
}

export function VehiculePanel({ initial }: { initial: Vehicul[] }) {
  const [vehicule, setVehicule] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body = Object.fromEntries(
      ["vin", "marca", "model", "nrInmatriculare", "combustibil", "normaPoluare", "emisiiCo2GKm", "putereKw"].map(
        (k) => [k, String(fd.get(k) ?? "")],
      ),
    );
    const res = await fetch("/api/vehicule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError("Date invalide: " + ((b.fields ?? []).join(", ") || "verifică câmpurile"));
      return;
    }
    const { vehicul } = await res.json();
    setVehicule((v) => [vehicul, ...v]);
    form.reset();
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
      <form onSubmit={onAdd} style={{ display: "grid", gap: 8 }}>
        <input name="marca" placeholder="Marcă" data-testid="v-marca" />
        <input name="model" placeholder="Model" data-testid="v-model" />
        <input name="nrInmatriculare" placeholder="Nr. înmatriculare" data-testid="v-nr" />
        <input name="vin" placeholder="VIN (17 caractere)" data-testid="v-vin" />
        <input name="normaPoluare" placeholder="Normă poluare (ex. Euro 6)" data-testid="v-norma" />
        <input name="emisiiCo2GKm" placeholder="Emisii CO2 (g/km)" data-testid="v-co2" />
        <input name="putereKw" placeholder="Putere (kW)" data-testid="v-putere" />
        <select name="combustibil" data-testid="v-combustibil" defaultValue="">
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
      {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
