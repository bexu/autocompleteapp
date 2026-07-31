"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Doc {
  id: string;
  tip: string;
  filename: string;
  sizeBytes: number;
  retainUntil: string;
  createdAt: string;
}

function kb(n: number): string {
  return n < 1024 ? `${n} B` : `${Math.round(n / 1024)} KB`;
}

// Seiful de documente: backend-ul exista complet (stocare criptată, retenție,
// descărcare, ștergere) dar nu avea niciun ecran — scanurile erau invizibile.
export function DocumentsPanel({ documents }: { documents: Doc[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function remove(id: string) {
    setBusy(id);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  return (
    <main className="container container--wide">
      <div className="page-head">
        <p className="eyebrow">Datele tale</p>
        <h1 className="page-title">Documentele mele</h1>
        <p className="lead">
          Scanurile urcate, stocate criptat. Se șterg automat la data de retenție —
          sau le poți șterge acum.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="card card--pad">
          <p data-testid="empty" className="muted">
            Niciun document încărcat. Poți urca buletinul din „Încarcă buletinul” sau un
            certificat de înmatriculare din „Vehiculele mele”.
          </p>
        </div>
      ) : (
        <ul className="list" data-testid="documents-list">
          {documents.map((d) => (
            <li key={d.id} className="list__item" data-testid={`doc-${d.id}`}>
              <span className="list__main">
                <span className="pill pill--neutral">{d.tip}</span>{" "}
                <strong>{d.filename}</strong>
                <span className="muted" style={{ fontSize: "var(--fs-sm)", display: "block", fontWeight: 400 }}>
                  {kb(d.sizeBytes)} · urcat {d.createdAt} · se șterge automat pe {d.retainUntil}
                </span>
              </span>
              <span className="row" style={{ gap: "0.5rem" }}>
                <a href={`/api/documents/${d.id}`} download className="btn btn--ghost btn--sm" data-testid={`download-${d.id}`}>
                  descarcă
                </a>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => remove(d.id)}
                  disabled={busy === d.id}
                  data-testid={`delete-${d.id}`}
                >
                  {busy === d.id ? "..." : "șterge"}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
