"use client";

import { useState } from "react";

interface Props {
  initial: { nume: string; prenume: string; telefon: string };
  cnpMask: string | null;
  ibanMask: string | null;
}

export function ProfileForm({ initial, cnpMask, ibanMask }: Props) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorFields, setErrorFields] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setErrorFields([]);
    const form = new FormData(e.currentTarget);

    // Câmpurile tari se trimit doar dacă au fost (re)completate — altfel se
    // păstrează valoarea existentă (update parțial).
    const payload: Record<string, unknown> = {
      nume: String(form.get("nume") ?? ""),
      prenume: String(form.get("prenume") ?? ""),
      telefon: String(form.get("telefon") ?? ""),
    };
    const cnp = String(form.get("cnp") ?? "").trim();
    const iban = String(form.get("iban") ?? "").trim();
    if (cnp) payload.cnp = cnp;
    if (iban) payload.iban = iban;

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatus("saved");
      // Reîncarcă pentru a reflecta măștile actualizate din server.
      setTimeout(() => window.location.reload(), 300);
      return;
    }
    const body = await res.json().catch(() => ({}));
    setErrorFields(Array.isArray(body.fields) ? body.fields : []);
    setStatus("error");
  }

  return (
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Profilul meu</h1>
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          Nume
          <input name="nume" defaultValue={initial.nume} data-testid="nume" />
        </label>
        <label>
          Prenume
          <input name="prenume" defaultValue={initial.prenume} data-testid="prenume" />
        </label>
        <label>
          Telefon
          <input name="telefon" defaultValue={initial.telefon} data-testid="telefon" />
        </label>
        <label>
          CNP {cnpMask && <span data-testid="cnp-mask">(salvat: {cnpMask})</span>}
          <input
            name="cnp"
            placeholder={cnpMask ? "lasă gol ca să păstrezi" : "13 cifre"}
            data-testid="cnp"
          />
        </label>
        <label>
          IBAN {ibanMask && <span data-testid="iban-mask">(salvat: {ibanMask})</span>}
          <input
            name="iban"
            placeholder={ibanMask ? "lasă gol ca să păstrezi" : "RO..."}
            data-testid="iban"
          />
        </label>
        <button type="submit" disabled={status === "saving"} data-testid="save">
          {status === "saving" ? "Se salvează..." : "Salvează"}
        </button>
      </form>

      {status === "saved" && <p data-testid="saved" style={{ color: "green" }}>Salvat.</p>}
      {status === "error" && (
        <p role="alert" data-testid="error" style={{ color: "crimson" }}>
          Date invalide: {errorFields.join(", ") || "verifică câmpurile"}
        </p>
      )}
    </main>
  );
}
