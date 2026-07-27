"use client";

import { useState } from "react";

interface VehiculOpt {
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

export function AutoWizard({ vehicule }: { vehicule: VehiculOpt[] }) {
  const [event, setEvent] = useState<"VANZARE" | "CUMPARARE">("VANZARE");
  const [result, setResult] = useState<CaseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      event,
      vehicleId: String(fd.get("vehicleId") ?? ""),
      contrapartaNume: String(fd.get("contrapartaNume") ?? ""),
      contrapartaCnp: String(fd.get("contrapartaCnp") ?? ""),
      pret: String(fd.get("pret") ?? ""),
      data: String(fd.get("data") ?? ""),
    };
    const res = await fetch("/api/auto/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(
        b.error === "validare"
          ? "Completează profilul și datele vehiculului: " + (b.fields ?? []).join(", ")
          : "Generare eșuată: " + (b.error ?? ""),
      );
      return;
    }
    setResult(await res.json());
  }

  if (vehicule.length === 0) {
    return (
      <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
        <h1>Dosar auto</h1>
        <p data-testid="no-vehicle">Adaugă întâi un vehicul în „Vehiculele mele”.</p>
      </main>
    );
  }

  if (result) {
    return (
      <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
        <h1>{result.label} — dosar generat</h1>
        <h2>Documente generate</h2>
        <ul data-testid="forms">
          {result.forms.map((f) => (
            <li key={f.dossierId} data-testid={`form-${f.formCode}`}>
              {f.formCode} — {f.title}{" "}
              <a href={`/dashboard/dosare/${f.dossierId}`} data-testid={`dosar-${f.formCode}`}>
                deschide dosarul
              </a>
            </li>
          ))}
        </ul>
        <h2>Pași (checklist)</h2>
        <ol data-testid="auto-checklist">
          {result.checklist.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Dosar auto</h1>
      <p>Ce s-a întâmplat? Generăm documentele și pașii potriviți.</p>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <label>
          <input type="radio" checked={event === "VANZARE"} onChange={() => setEvent("VANZARE")} data-testid="ev-vanzare" />
          Am vândut mașina
        </label>
        <label>
          <input type="radio" checked={event === "CUMPARARE"} onChange={() => setEvent("CUMPARARE")} data-testid="ev-cumparare" />
          Am cumpărat o mașină
        </label>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Vehicul
          <select name="vehicleId" required data-testid="vehicleId">
            {vehicule.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </label>

        {event === "VANZARE" && (
          <>
            <input name="contrapartaNume" placeholder="Cumpărător — nume complet" data-testid="contraparta-nume" />
            <input name="contrapartaCnp" placeholder="Cumpărător — CNP" data-testid="contraparta-cnp" />
            <input name="pret" placeholder="Preț (lei)" data-testid="pret" />
            <input name="data" placeholder="Data (AAAA-LL-ZZ)" data-testid="data" />
          </>
        )}

        <button type="submit" disabled={busy} data-testid="genereaza-dosar">
          {busy ? "Se generează..." : "Generează dosarul"}
        </button>
      </form>
      {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
