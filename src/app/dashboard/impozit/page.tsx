import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listImobile } from "@/lib/imobil/repository";
import { ImpozitForm } from "./impozit-form";

export default async function ImpozitPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const imobile = await listImobile(session.user.id);
  return (
    <ImpozitForm
      imobile={imobile.map((im) => ({
        id: im.id,
        tip: im.tip,
        label: `${im.tip} — ${[im.strada, im.localitate].filter(Boolean).join(", ") || im.nrCadastral || im.id.slice(0, 6)}`,
      }))}
    />
  );
}
