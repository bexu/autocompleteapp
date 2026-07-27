import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listVehicule } from "@/lib/vehicle/repository";
import { AutoWizard } from "./auto-wizard";

export default async function AutoPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const vehicule = await listVehicule(session.user.id);
  return (
    <AutoWizard
      vehicule={vehicule.map((v) => ({
        id: v.id,
        label: `${v.marca ?? ""} ${v.model ?? ""} — ${v.nrInmatriculare || v.vin || v.id.slice(0, 6)}`.trim(),
      }))}
    />
  );
}
