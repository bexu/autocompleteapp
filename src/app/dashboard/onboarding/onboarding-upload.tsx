"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Extracted {
  nume: string | null;
  prenume: string | null;
  cnp: string | null;
  ciSerie: string | null;
  ciNr: string | null;
  sex: "M" | "F" | null;
  dataNasterii: string | null;
  ciExp: string | null;
  source: "mrz" | "none";
}

export function OnboardingUpload() {
  const router = useRouter();
  const [phase, setPhase] = useState<"upload" | "review">("upload");
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    form.set("tip", "CI");
    const res = await fetch("/api/documents", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      setError("Încărcare eșuată.");
      return;
    }
    const data = await res.json();
    if (!data.extracted || data.extracted.source === "none") {
      setError("Nu am putut citi datele automat. Completează-le manual în profil.");
      setExtracted(null);
      setPhase("review");
      return;
    }
    setExtracted(data.extracted);
    setPhase("review");
  }

  async function onConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);

    if (!form.get("consent")) {
      setBusy(false);
      setError("Bifează acordul pentru procesarea datelor de identitate.");
      return;
    }
    // Consimțământ explicit înainte de a salva date de identitate + scanul.
    await fetch("/api/gdpr/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "IDENTITATE", action: "grant" }),
    });
    await fetch("/api/gdpr/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "DOCUMENTE", action: "grant" }),
    });

    const payload: Record<string, unknown> = {};
    for (const key of ["nume", "prenume", "cnp", "ciSerie", "ciNr", "sex", "dataNasterii", "ciExp"]) {
      const v = String(form.get(key) ?? "").trim();
      if (v) payload[key] = v;
    }
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError("Date invalide: " + ((body.fields ?? []).join(", ") || "verifică câmpurile"));
      return;
    }
    router.push("/dashboard/profil");
  }

  if (phase === "upload") {
    return (
      <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
        <h1>Încarcă buletinul (CI)</h1>
        <p>Extragem automat datele din zona MRZ. Le confirmi tu înainte de salvare.</p>
        <form onSubmit={onUpload} style={{ display: "grid", gap: 12 }}>
          <input type="file" name="file" required data-testid="file" />
          <button type="submit" disabled={busy} data-testid="upload">
            {busy ? "Se procesează..." : "Încarcă și extrage"}
          </button>
        </form>
        {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
      </main>
    );
  }

  const f = extracted;
  return (
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Confirmă datele extrase</h1>
      <p>Verifică și corectează dacă e nevoie, apoi salvează în profil.</p>
      <form onSubmit={onConfirm} style={{ display: "grid", gap: 10 }}>
        <input name="nume" defaultValue={f?.nume ?? ""} placeholder="Nume" data-testid="f-nume" />
        <input name="prenume" defaultValue={f?.prenume ?? ""} placeholder="Prenume" data-testid="f-prenume" />
        <input name="cnp" defaultValue={f?.cnp ?? ""} placeholder="CNP" data-testid="f-cnp" />
        <input name="ciSerie" defaultValue={f?.ciSerie ?? ""} placeholder="Serie CI" data-testid="f-serie" />
        <input name="ciNr" defaultValue={f?.ciNr ?? ""} placeholder="Număr CI" data-testid="f-nr" />
        <input name="sex" defaultValue={f?.sex ?? ""} placeholder="Sex (M/F)" data-testid="f-sex" />
        <input name="dataNasterii" defaultValue={f?.dataNasterii ?? ""} placeholder="Data nașterii" data-testid="f-dob" />
        <input name="ciExp" defaultValue={f?.ciExp ?? ""} placeholder="Expirare CI" data-testid="f-exp" />
        <label style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" name="consent" data-testid="consent" />
          Sunt de acord cu procesarea datelor de identitate și a scanului.
        </label>
        <button type="submit" disabled={busy} data-testid="confirm">
          {busy ? "Se salvează..." : "Confirmă și salvează"}
        </button>
      </form>
      {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
