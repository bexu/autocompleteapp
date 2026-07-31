import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { listDocuments } from "@/lib/documents/repository";
import { DocumentsPanel } from "./documents-panel";

export default async function DocumentePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const documents = await listDocuments(session.user.id);
  return (
    <DocumentsPanel
      documents={documents.map((d) => ({
        id: d.id,
        tip: d.tip,
        filename: d.filename,
        sizeBytes: d.sizeBytes,
        retainUntil: d.retainUntil.toISOString().slice(0, 10),
        createdAt: d.createdAt.toISOString().slice(0, 10),
      }))}
    />
  );
}
