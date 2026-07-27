import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listReminders } from "@/lib/reminders/service";
import { LogoutButton } from "./logout-button";

// Pagină protejată: fără sesiune → redirect la /login (guard RBAC de bază).
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user } = session;
  const role = (user as { role?: string }).role ?? "user";
  const reminders = await listReminders(user.id);

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Contul meu</h1>
      <p>
        Autentificat ca <strong data-testid="user-email">{user.email}</strong>
      </p>
      <p>
        Rol: <span data-testid="user-role">{role}</span>
      </p>

      {reminders.length > 0 && (
        <section data-testid="reminders" style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
          <strong>Termene apropiate</strong>
          <ul>
            {reminders.map((r) => (
              <li key={r.id}>
                Formular {r.formCode} — termen {r.deadlineAt.toISOString().slice(0, 10)}
              </li>
            ))}
          </ul>
        </section>
      )}
      <p style={{ display: "flex", gap: 12 }}>
        <Link href="/dashboard/onboarding" data-testid="link-onboarding">
          Încarcă buletinul
        </Link>
        <Link href="/dashboard/profil" data-testid="link-profil">
          Profilul meu
        </Link>
        <Link href="/dashboard/confidentialitate" data-testid="link-confidentialitate">
          Confidențialitate
        </Link>
        <Link href="/dashboard/formulare/230" data-testid="link-230">
          Formular 230
        </Link>
        <Link href="/dashboard/dosare" data-testid="link-dosare">
          Dosarele mele
        </Link>
        <Link href="/dashboard/vehicule" data-testid="link-vehicule">
          Vehiculele mele
        </Link>
      </p>
      <LogoutButton />
    </main>
  );
}
