import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  TIP_ENTITATE,
  DOVADA_SPATIU,
  DA_NU,
  TIP_MENTIUNE,
  MOTIV_RADIERE,
  MOD_ELIBERARE,
} from "@/lib/forms/pfa";
import { PfaWizard } from "./pfa-wizard";

export default async function PfaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <PfaWizard
      enums={{
        tipEntitate: TIP_ENTITATE,
        dovadaSpatiu: DOVADA_SPATIU,
        daNu: DA_NU,
        tipMentiune: TIP_MENTIUNE,
        motivRadiere: MOTIV_RADIERE,
        modEliberare: MOD_ELIBERARE,
      }}
    />
  );
}
