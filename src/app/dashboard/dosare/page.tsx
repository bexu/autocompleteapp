import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listDossiers } from "@/lib/dispatch/repository";

export default async function DosarePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const dossiers = await listDossiers(session.user.id);

  return (
    <main className="container container--wide">
      <div className="page-head">
        <p className="eyebrow">Urmărire</p>
        <h1 className="page-title">Dosarele mele</h1>
        <p className="lead">Fiecare formular generat, cu starea depunerii.</p>
      </div>

      {dossiers.length === 0 && (
        <div className="card card--pad">
          <p data-testid="empty" className="muted">Niciun dosar încă. Generează un formular din pagina principală.</p>
        </div>
      )}

      <ul className="list" data-testid="dossier-list">
        {dossiers.map((d) => (
          <li key={d.id} className="list__item">
            <Link
              href={`/dashboard/dosare/${d.id}`}
              data-testid={`dossier-${d.formCode}`}
              className="list__main"
              style={{ fontWeight: 560 }}
            >
              <span className="mono">{d.formCode}</span>
              {d.deadline && <span className="muted" style={{ fontSize: "var(--fs-sm)" }}> · termen {d.deadline}</span>}
            </Link>
            <span
              data-testid={`status-${d.id}`}
              className={`pill ${d.status === "DEPUS" ? "pill--ok" : "pill--warn"}`}
            >
              {d.status === "DEPUS" ? "Depus" : "De depus"}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
