import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listImobile } from "@/lib/imobil/repository";
import { ImobilePanel } from "./imobile-panel";

export default async function ImobilePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const imobile = await listImobile(session.user.id);
  return (
    <ImobilePanel
      initial={imobile.map((im) => ({
        id: im.id,
        tip: im.tip,
        localitate: im.localitate,
        strada: im.strada,
        nrCadastral: im.nrCadastral,
      }))}
    />
  );
}
