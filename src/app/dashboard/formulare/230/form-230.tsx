"use client";

import { useState } from "react";

interface Field {
  key: string;
  label: string;
  value: string;
}

export function Form230() {
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
      <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
        <h1>Exact ce semnezi</h1>
        <p>Verifică datele înainte de a semna. Semnezi și depui pe propria răspundere.</p>
        <table data-testid="preview" style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {preview.map((f) => (
              <tr key={f.key}>
                <td style={{ padding: "4px 8px", fontWeight: 600 }}>{f.label}</td>
                <td style={{ padding: "4px 8px" }} data-testid={`pv-${f.key}`}>
                  {f.value || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button type="button" onClick={() => setPreview(null)} data-testid="inapoi">
            Înapoi
          </button>
          <button type="button" onClick={onSign} disabled={busy} data-testid="semneaza">
            {busy ? "Se semnează..." : "Semnează și arhivează"}
          </button>
        </div>
        {signed && (
          <p data-testid="signed" style={{ color: "green" }}>
            Semnat, arhivat și descărcat.{" "}
            {dossierId && (
              <a href={`/dashboard/dosare/${dossierId}`} data-testid="vezi-dosar">
                Vezi pașii de depunere
              </a>
            )}
          </p>
        )}
        {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Formular 230 — redirecționare 3,5%</h1>
      <p>Datele tale vin din profil. Completează entitatea beneficiară.</p>
      <form onSubmit={onPreview} style={{ display: "grid", gap: 12 }}>
        <input name="beneficiarDenumire" placeholder="Denumire entitate" required data-testid="benef-denumire" />
        <input name="beneficiarCif" placeholder="CIF entitate" required data-testid="benef-cif" />
        <input name="beneficiarIban" placeholder="IBAN entitate" required data-testid="benef-iban" />
        <label style={{ display: "flex", gap: 8 }}>
          <input type="checkbox" name="doiAni" data-testid="benef-doiani" />
          Redirecționez pe 2 ani
        </label>
        <button type="submit" disabled={busy} data-testid="previzualizeaza">
          {busy ? "Se procesează..." : "Previzualizează"}
        </button>
      </form>
      {error && <p role="alert" data-testid="error" style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
