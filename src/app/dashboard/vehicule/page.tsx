import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listVehicule } from "@/lib/vehicle/repository";
import { VehiculePanel } from "./vehicule-panel";

export default async function VehiculePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const vehicule = await listVehicule(session.user.id);
  return (
    <VehiculePanel
      initial={vehicule.map((v) => ({
        id: v.id,
        marca: v.marca,
        model: v.model,
        nrInmatriculare: v.nrInmatriculare,
        vin: v.vin,
      }))}
    />
  );
}
