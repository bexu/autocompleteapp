"use client";

import { useState } from "react";

interface Field {
  key: string;
  label: string;
  value: string;
}

export function Form230({ qualified = false }: { qualified?: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<Field[] | null>(null);
  const [inputs, setInputs] = useState<Record<string, unknown> | null>(null);
  const [signed, setSigned] = useState(false);
  const [dossierId, setDossierId] = useState<string | null>(null);

  function readInputs(form: FormData): Record<string, unknown> {
    return {
      beneficiarDenumire: String(form.get("beneficiarDenumire") ?? ""),
      beneficiarCif: String(form.get("beneficiarCif") ?? ""),
      beneficiarIban: String(form.get("beneficiarIban") ?? ""),
      doiAni: form.get("doiAni") === "on",
    };
  }

  function showValidationError(fields: string[]) {
    setError(
      fields.includes("cnp") || fields.includes("nume")
        ? "Completează-ți întâi profilul (nume, CNP)."
        : "Date invalide: " + fields.join(", "),
    );
  }

  async function onPreview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = readInputs(new FormData(e.currentTarget));
    const res = await fetch("/api/forms/230/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (body.error === "validare") showValidationError(body.fields ?? []);
      else setError("Preview eșuat.");
      return;
    }
    const body = await res.json();
    setInputs(data);
    setPreview(body.fields);
  }

  async function onSign() {
    if (!inputs) return;
    setError(null);
    setBusy(true);
    const res = await fetch("/api/forms/230/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Semnare eșuată.");
      return;
    }
    setDossierId(res.headers.get("X-Dossier-Id"));
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formular-230-semnat.pdf";
    a.click();
    URL.revokeObjectURL(url);
    setSigned(true);
  }

  if (preview) {
    return (
      <main className="container container--narrow">
        <div className="page-head">
          <p className="eyebrow">Formular 230 · pas 2 din 2</p>
          <h1 className="page-title">Exact ce semnezi</h1>
          <p className="lead">Verifică datele. Semnezi și depui pe propria răspundere.</p>
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
            <button type="button" className="btn btn--primary" onClick={onSign} disabled={busy} data-testid="semneaza">
              {busy ? "Se generează..." : "Generează și arhivează"}
            </button>
          </div>
          {!qualified && (
            <p className="muted" style={{ fontSize: "var(--fs-sm)", marginTop: "0.6rem" }} data-testid="nota-semnatura">
              Documentul se generează și se arhivează, dar <strong>nu poartă încă o
              semnătură electronică calificată</strong> — semnătura o aplici tu (olograf
              la depunere sau cu certificatul propriu).
            </p>
          )}
          {signed && (
            <p data-testid="signed" className="alert alert--ok" style={{ marginTop: "1rem" }}>
              Generat, arhivat și descărcat.{" "}
              {dossierId && (
                <a href={`/dashboard/dosare/${dossierId}`} data-testid="vezi-dosar">
                  Vezi pașii de depunere →
                </a>
              )}
            </p>
          )}
          {error && (
            <p role="alert" data-testid="error" className="alert alert--error" style={{ marginTop: "1rem" }}>
              {error}
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="container container--narrow">
      <div className="page-head">
        <p className="eyebrow">Redirecționare 3,5% din impozit · pas 1 din 2</p>
        <h1 className="page-title">Formular 230</h1>
        <p className="lead">Datele tale vin din profil. Completează entitatea beneficiară.</p>
      </div>
      <div className="card card--pad">
        <form onSubmit={onPreview} className="form">
          <div className="field">
            <label className="field__label" htmlFor="b-denumire">Denumire entitate</label>
            <input id="b-denumire" className="input" name="beneficiarDenumire" placeholder="Asociația ..." required data-testid="benef-denumire" />
          </div>
          <div className="grid-2">
            <div className="field">
              <label className="field__label" htmlFor="b-cif">CIF entitate</label>
              <input id="b-cif" className="input input--mono" name="beneficiarCif" placeholder="12345678" required data-testid="benef-cif" />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="b-iban">IBAN entitate</label>
              <input id="b-iban" className="input input--mono" name="beneficiarIban" placeholder="RO49..." required data-testid="benef-iban" />
            </div>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" name="doiAni" data-testid="benef-doiani" />
            Redirecționez pe 2 ani
          </label>
          <button type="submit" className="btn btn--primary" disabled={busy} data-testid="previzualizeaza">
            {busy ? "Se procesează..." : "Previzualizează"}
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
