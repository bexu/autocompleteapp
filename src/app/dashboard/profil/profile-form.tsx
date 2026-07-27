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
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Date de identitate</p>
        <h1 className="page-title">Profilul meu</h1>
        <p className="lead">
          Câmpurile tari (CNP, IBAN) se stochează criptat și se afișează mascat.
        </p>
      </div>

      <div className="card card--pad">
        <form onSubmit={onSubmit} className="form">
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="pf-nume">Nume</label>
              <input id="pf-nume" className="input" name="nume" defaultValue={initial.nume} data-testid="nume" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="pf-prenume">Prenume</label>
              <input id="pf-prenume" className="input" name="prenume" defaultValue={initial.prenume} data-testid="prenume" />
            </div>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pf-telefon">Telefon</label>
            <input id="pf-telefon" className="input" name="telefon" defaultValue={initial.telefon} data-testid="telefon" />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pf-cnp">
              CNP{" "}
              {cnpMask && (
                <span className="pill pill--ok" data-testid="cnp-mask">
                  salvat: {cnpMask}
                </span>
              )}
            </label>
            <input
              id="pf-cnp"
              className="input input--mono"
              name="cnp"
              placeholder={cnpMask ? "lasă gol ca să păstrezi" : "13 cifre"}
              data-testid="cnp"
            />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="pf-iban">
              IBAN{" "}
              {ibanMask && (
                <span className="pill pill--ok" data-testid="iban-mask">
                  salvat: {ibanMask}
                </span>
              )}
            </label>
            <input
              id="pf-iban"
              className="input input--mono"
              name="iban"
              placeholder={ibanMask ? "lasă gol ca să păstrezi" : "RO49..."}
              data-testid="iban"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={status === "saving"} data-testid="save">
              {status === "saving" ? "Se salvează..." : "Salvează"}
            </button>
            {status === "saved" && (
              <span data-testid="saved" className="pill pill--ok">
                Salvat
              </span>
            )}
          </div>
        </form>

        {status === "error" && (
          <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "0.9rem" }}>
            Date invalide: {errorFields.join(", ") || "verifică câmpurile"}
          </p>
        )}
      </div>
    </main>
  );
}
