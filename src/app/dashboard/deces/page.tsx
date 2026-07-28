import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  DECEDAT_CALITATE,
  CALITATE_SOLICITANT_DECES,
  MODALITATE_PLATA_DECES,
  CALITATE_URMAS,
  CAUZA_DECES,
} from "@/lib/forms/deces";
import { DecesWizard } from "./deces-wizard";

export default async function DecesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return (
    <DecesWizard
      enums={{
        decedatCalitate: DECEDAT_CALITATE,
        calitateSolicitant: CALITATE_SOLICITANT_DECES,
        modalitatePlata: MODALITATE_PLATA_DECES,
        calitateUrmas: CALITATE_URMAS,
        cauzaDeces: CAUZA_DECES,
      }}
    />
  );
}
