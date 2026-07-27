import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listImobile } from "@/lib/imobil/repository";
import { C168Form } from "./c168-form";

export default async function C168Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  const imobile = await listImobile(session.user.id);
  return (
    <C168Form
      imobile={imobile.map((im) => ({
        id: im.id,
        label: `${im.tip} — ${[im.strada, im.localitate].filter(Boolean).join(", ") || im.nrCadastral || im.id.slice(0, 6)}`,
      }))}
    />
  );
}
