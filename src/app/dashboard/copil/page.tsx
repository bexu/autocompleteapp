import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { CopilWizard } from "./copil-wizard";

export default async function CopilPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <CopilWizard />;
}
