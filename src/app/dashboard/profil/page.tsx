import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getProfile } from "@/lib/profile/repository";
import { ProfileForm } from "./profile-form";

// Maschează un identificator pentru afișare (nu trimitem CNP/IBAN întreg în UI
// la fiecare încărcare — doar ultimele 4 caractere).
function maskTail(v: string | null): string | null {
  if (!v) return null;
  return v.length <= 4 ? "••••" : `•••• ${v.slice(-4)}`;
}

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const p = await getProfile(session.user.id);

  return (
    <ProfileForm
      initial={{
        nume: p?.nume ?? "",
        prenume: p?.prenume ?? "",
        telefon: p?.telefon ?? "",
      }}
      cnpMask={maskTail(p?.cnp ?? null)}
      ibanMask={maskTail(p?.iban ?? null)}
    />
  );
}
