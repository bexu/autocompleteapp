"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SubmitButton({ dossierId, initialStatus }: { dossierId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function markSubmitted() {
    setBusy(true);
    const res = await fetch(`/api/dossiers/${dossierId}/submit`, { method: "POST" });
    setBusy(false);
    if (res.ok) {
      setStatus("DEPUS");
      router.refresh();
    }
  }

  if (status === "DEPUS") {
    return <p data-testid="status-depus" style={{ color: "green" }}>Dosar marcat ca depus.</p>;
  }

  return (
    <button type="button" onClick={markSubmitted} disabled={busy} data-testid="marcheaza-depus">
      {busy ? "..." : "Marchează ca depus"}
    </button>
  );
}
