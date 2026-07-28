import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { OPTIUNI_PLATA } from "@/lib/forms/somaj";
import { SomajWizard } from "./somaj-wizard";

export default async function SomajPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <SomajWizard optiuniPlata={OPTIUNI_PLATA} />;
}
