import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isQualifiedSignature } from "@/lib/signature/provider";
import { Form230 } from "./form-230";

export default async function Formular230Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Form230 qualified={isQualifiedSignature()} />;
}
