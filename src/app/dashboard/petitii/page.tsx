import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { INSTITUTII } from "@/lib/forms/petitii";
import { PetitiiWizard } from "./petitii-wizard";

export default async function PetitiiPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <PetitiiWizard institutii={INSTITUTII} />;
}
