import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listImobile } from "@/lib/imobil/repository";
import { SCOP_CERTIFICAT, TIP_OBIECT, TIP_LUCRARE } from "@/lib/forms/urbanism";
import { UrbanismWizard } from "./urbanism-wizard";

export default async function UrbanismPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const imobile = await listImobile(session.user.id);
  return (
    <UrbanismWizard
      imobile={imobile.map((im) => ({
        id: im.id,
        label: `${im.tip} — ${[im.strada, im.localitate].filter(Boolean).join(", ") || im.nrCadastral || im.id.slice(0, 6)}`,
      }))}
      enums={{ scopCertificat: SCOP_CERTIFICAT, tipObiect: TIP_OBIECT, tipLucrare: TIP_LUCRARE }}
    />
  );
}
