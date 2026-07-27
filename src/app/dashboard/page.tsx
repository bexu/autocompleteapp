import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listReminders } from "@/lib/reminders/service";
import { listDossiers } from "@/lib/dispatch/repository";
import { listVehicule } from "@/lib/vehicle/repository";
import { listSignedForms } from "@/lib/signature/repository";
import { LogoutButton } from "./logout-button";

// Pagină protejată: fără sesiune → redirect la /login (guard RBAC de bază).
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user } = session;
  const role = (user as { role?: string }).role ?? "user";
  const [reminders, dossiers, vehicule, signedForms] = await Promise.all([
    listReminders(user.id),
    listDossiers(user.id),
    listVehicule(user.id),
    listSignedForms(user.id),
  ]);
  const deDepus = dossiers.filter((d) => d.status === "DE_DEPUS").length;

  const stats = [
    { label: "Dosare de depus", value: deDepus, sub: `${dossiers.length} în total`, tone: deDepus > 0 ? "warn" : "", href: "/dashboard/dosare" },
    { label: "Termene apropiate", value: reminders.length, sub: "notificări active", tone: reminders.length > 0 ? "critical" : "", href: "/dashboard/dosare" },
    { label: "Documente generate", value: signedForms.length, sub: "arhivate criptat", tone: "accent", href: "/dashboard/dosare" },
    { label: "Vehicule", value: vehicule.length, sub: "pentru dosarul auto", tone: "", href: "/dashboard/vehicule" },
  ];

  const groups = [
    {
      label: "Profilul tău",
      items: [
        { href: "/dashboard/onboarding", testid: "link-onboarding", title: "Încarcă buletinul", desc: "Extragem datele din zona MRZ a CI." },
        { href: "/dashboard/profil", testid: "link-profil", title: "Profilul meu", desc: "Datele de identitate, criptate." },
      ],
    },
    {
      label: "Ce ai de făcut",
      items: [
        { href: "/dashboard/formulare/230", testid: "link-230", title: "Formular 230", desc: "Redirecționează 3,5% din impozit." },
        { href: "/dashboard/auto", testid: "link-auto", title: "Dosar auto", desc: "Am cumpărat / am vândut o mașină." },
      ],
    },
    {
      label: "Urmărire",
      items: [
        { href: "/dashboard/dosare", testid: "link-dosare", title: "Dosarele mele", desc: "Stare depunere și pași rămași." },
        { href: "/dashboard/vehicule", testid: "link-vehicule", title: "Vehiculele mele", desc: "Date din certificatul de înmatriculare." },
      ],
    },
    {
      label: "Cont & date",
      items: [
        { href: "/dashboard/confidentialitate", testid: "link-confidentialitate", title: "Confidențialitate", desc: "Consimțământ, export și ștergere date." },
      ],
    },
  ];

  return (
    <main className="container container--wide">
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p className="eyebrow">Contul meu</p>
          <h1 className="page-title">
            Salut, <span className="mono" data-testid="user-email">{user.email}</span>
          </h1>
          <p className="lead">
            <span className="pill pill--neutral">
              rol: <span data-testid="user-role">{role}</span>
            </span>
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="stat-grid" style={{ marginBottom: "1.4rem" }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`stat ${s.tone ? `stat--${s.tone}` : ""}`}>
            <span className="stat__label">{s.label}</span>
            <span className="stat__value">{s.value}</span>
            <span className="stat__sub">{s.sub}</span>
          </Link>
        ))}
      </div>

      {reminders.length > 0 && (
        <section data-testid="reminders" className="notice" style={{ marginBottom: "1.6rem" }}>
          <span aria-hidden="true">⏰</span>
          <div>
            <strong>Termene apropiate</strong>
            <ul style={{ listStyle: "none", marginTop: "0.3rem" }}>
              {reminders.map((r) => (
                <li key={r.id}>
                  Formular <span className="mono">{r.formCode}</span> — termen{" "}
                  <span className="mono">{r.deadlineAt.toISOString().slice(0, 10)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {groups.map((g) => (
        <div key={g.label}>
          <p className="section-label">{g.label}</p>
          <div className="card-grid">
            {g.items.map((it) => (
              <Link key={it.testid} href={it.href} className="action-card" data-testid={it.testid}>
                <span className="action-card__title">{it.title}</span>
                <span className="action-card__desc">{it.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
