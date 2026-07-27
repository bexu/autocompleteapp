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
    <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Dosar — formular {dossier.formCode}</h1>
      <p>
        Stare: <strong data-testid="dossier-status">{dossier.status === "DEPUS" ? "Depus" : "De depus"}</strong>
        {dossier.deadline && ` · termen: ${dossier.deadline}`}
      </p>

      {handoff && (
        <>
          <section>
            <h2>Pași de urmat</h2>
            <ol data-testid="checklist">
              {handoff.checklist.map((s) => (
                <li key={s.id}>{s.label}</li>
              ))}
            </ol>
          </section>

          <section>
            <h2>Unde depui</h2>
            <ul data-testid="channels">
              {handoff.channels.map((c) => (
                <li key={c.id} data-testid={`channel-${c.id}`}>
                  <strong>{c.label}</strong>
                  {c.url && (
                    <>
                      {" "}
                      <a href={c.url} target="_blank" rel="noopener noreferrer" data-testid={`channel-link-${c.id}`}>
                        deschide
                      </a>
                    </>
                  )}
                  <br />
                  <span>{c.instructions}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <SubmitButton dossierId={dossier.id} initialStatus={dossier.status} />
    </main>
  );
}
