import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getDossier } from "@/lib/dispatch/repository";
import { getManifestById } from "@/lib/forms/registered";
import { buildHandoff } from "@/lib/dispatch/handoff";
import { SubmitButton } from "./submit-button";

export default async function DossierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;

  const dossier = await getDossier(session.user.id, id);
  if (!dossier) notFound();

  const manifest = getManifestById(dossier.manifestId);
  const handoff = manifest ? buildHandoff(manifest) : null;

  return (
    <main className="container container--narrow">
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <p className="eyebrow">Dosar de depunere</p>
          <h1 className="page-title">
            Formular <span className="mono">{dossier.formCode}</span>
          </h1>
          {dossier.deadline && <p className="lead">Termen: {dossier.deadline}</p>}
        </div>
        <span
          data-testid="dossier-status"
          className={`pill ${dossier.status === "DEPUS" ? "pill--ok" : "pill--warn"}`}
        >
          {dossier.status === "DEPUS" ? "Depus" : "De depus"}
        </span>
      </div>

      {handoff && (
        <div className="stack">
          <div className="card card--pad">
            <p className="section-label" style={{ marginTop: 0 }}>Pași de urmat</p>
            <ol className="steps" data-testid="checklist">
              {handoff.checklist.map((s) => (
                <li key={s.id}>{s.label}</li>
              ))}
            </ol>
          </div>

          <div className="card card--pad">
            <p className="section-label" style={{ marginTop: 0 }}>Unde depui</p>
            <ul className="stack--sm" style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.9rem" }} data-testid="channels">
              {handoff.channels.map((c) => (
                <li key={c.id} data-testid={`channel-${c.id}`}>
                  <div className="row" style={{ gap: "0.5rem" }}>
                    <strong>{c.label}</strong>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noopener noreferrer" data-testid={`channel-link-${c.id}`} className="btn-link">
                        deschide ↗
                      </a>
                    )}
                  </div>
                  <span className="muted" style={{ fontSize: "var(--fs-sm)" }}>{c.instructions}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div style={{ marginTop: "1.4rem" }}>
        <SubmitButton dossierId={dossier.id} initialStatus={dossier.status} />
      </div>
    </main>
  );
}
