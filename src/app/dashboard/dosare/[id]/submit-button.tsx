"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmitButton({ dossierId, initialStatus }: { dossierId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function call(method: "POST" | "DELETE", path: string): Promise<boolean> {
    setBusy(true);
    const res = await fetch(path, { method });
    setBusy(false);
    return res.ok;
  }

  async function markSubmitted() {
    if (await call("POST", `/api/dossiers/${dossierId}/submit`)) {
      setStatus("DEPUS");
      router.refresh();
    }
  }

  async function undoSubmitted() {
    if (await call("DELETE", `/api/dossiers/${dossierId}/submit`)) {
      setStatus("DE_DEPUS");
      router.refresh();
    }
  }

  async function removeDossier() {
    if (await call("DELETE", `/api/dossiers/${dossierId}`)) {
      router.push("/dashboard/dosare");
      router.refresh();
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
      <div className="row" style={{ gap: "0.7rem", alignItems: "center", flexWrap: "wrap" }}>
        {status === "DEPUS" ? (
          <>
            <span data-testid="status-depus" className="alert alert--ok" style={{ margin: 0 }}>
              Dosar marcat ca depus.
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={undoSubmitted} disabled={busy} data-testid="anuleaza-depus">
              Nu l-am depus încă
            </button>
          </>
        ) : (
          <button type="button" className="btn btn--primary" onClick={markSubmitted} disabled={busy} data-testid="marcheaza-depus">
            {busy ? "..." : "Marchează ca depus"}
          </button>
        )}
      </div>

      {/* Ștergerea unui dosar greșit — cu confirmare: șterge și documentul arhivat. */}
      {confirmDelete ? (
        <div className="notice" data-testid="confirma-stergere">
          <span aria-hidden="true">🗑️</span>
          <div>
            <strong>Ștergi dosarul și documentul generat?</strong>
            <div className="row" style={{ gap: "0.6rem", marginTop: "0.5rem" }}>
              <button type="button" className="btn btn--primary btn--sm" onClick={removeDossier} disabled={busy} data-testid="sterge-confirma">
                Da, șterge
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)} disabled={busy}>
                Renunță
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          style={{ alignSelf: "flex-start" }}
          onClick={() => setConfirmDelete(true)}
          data-testid="sterge-dosar"
        >
          Șterge dosarul
        </button>
      )}
    </div>
  );
}
