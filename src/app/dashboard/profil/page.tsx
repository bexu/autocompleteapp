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
  // getProfile sortează adresele cu DOMICILIU pe poziția 0 (vezi repository).
  const dom = p?.addresses?.[0];

  return (
    <ProfileForm
      initial={{
        nume: p?.nume ?? "",
        prenume: p?.prenume ?? "",
        telefon: p?.telefon ?? "",
        judet: dom?.judet ?? "",
        localitate: dom?.localitate ?? "",
        strada: dom?.strada ?? "",
        nr: dom?.nr ?? "",
        codPostal: dom?.codPostal ?? "",
      }}
      cnpMask={maskTail(p?.cnp ?? null)}
      ibanMask={maskTail(p?.iban ?? null)}
    />
  );
}
