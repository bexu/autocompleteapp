import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listImobile } from "@/lib/imobil/repository";
import {
  FEL_INSCRIERE,
  MOD_COMUNICARE,
  REGIM_SOLUTIONARE,
  SCOP_EXTRAS,
  CALITATE_SOLICITANT,
} from "@/lib/forms/cadastru";
import { CadastruWizard } from "./cadastru-wizard";

export default async function CadastruPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const imobile = await listImobile(session.user.id);
  return (
    <CadastruWizard
      imobile={imobile.map((im) => ({
        id: im.id,
        label: `${im.tip} — ${[im.strada, im.localitate].filter(Boolean).join(", ") || im.nrCarteFunciara || im.nrCadastral || im.id.slice(0, 6)}`,
      }))}
      enums={{
        felInscriere: FEL_INSCRIERE,
        modComunicare: MOD_COMUNICARE,
        regimSolutionare: REGIM_SOLUTIONARE,
        scopExtras: SCOP_EXTRAS,
        calitateSolicitant: CALITATE_SOLICITANT,
      }}
    />
  );
}
