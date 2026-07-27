import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listDossiers } from "@/lib/dispatch/repository";

export default async function DosarePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const dossiers = await listDossiers(session.user.id);

  return (
    <main style={{ maxWidth: 560, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Dosarele mele</h1>
      {dossiers.length === 0 && <p data-testid="empty">Niciun dosar încă.</p>}
      <ul data-testid="dossier-list">
        {dossiers.map((d) => (
          <li key={d.id} style={{ marginBottom: 8 }}>
            <Link href={`/dashboard/dosare/${d.id}`} data-testid={`dossier-${d.formCode}`}>
              Formular {d.formCode}
            </Link>{" "}
            — <span data-testid={`status-${d.id}`}>{d.status === "DEPUS" ? "Depus" : "De depus"}</span>
            {d.deadline && ` (termen: ${d.deadline})`}
          </li>
        ))}
      </ul>
    </main>
  );
}
