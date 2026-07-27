import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "./logout-button";

// Pagină protejată: fără sesiune → redirect la /login (guard RBAC de bază).
export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user } = session;
  const role = (user as { role?: string }).role ?? "user";

  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", padding: "0 1rem" }}>
      <h1>Contul meu</h1>
      <p>
        Autentificat ca <strong data-testid="user-email">{user.email}</strong>
      </p>
      <p>
        Rol: <span data-testid="user-role">{role}</span>
      </p>
      <p style={{ display: "flex", gap: 12 }}>
        <Link href="/dashboard/onboarding" data-testid="link-onboarding">
          Încarcă buletinul
        </Link>
        <Link href="/dashboard/profil" data-testid="link-profil">
          Profilul meu
        </Link>
      </p>
      <LogoutButton />
    </main>
  );
}
