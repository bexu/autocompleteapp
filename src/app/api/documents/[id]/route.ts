import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { deleteDocument, getDocumentContent } from "@/lib/documents/repository";
import { observe } from "@/lib/http/observe";

type Ctx = [{ params: Promise<{ id: string }> }];

// Descarcă un document din seif (decriptat la cerere, doar pentru proprietar).
export const GET = observe<Ctx>("documents.download", async (_req, { params }) => {
  try {
    const user = await requireUser();
    const { id } = await params;
    const doc = await getDocumentContent(user.id, id);
    if (!doc) return NextResponse.json({ error: "inexistent" }, { status: 404 });
    return new NextResponse(new Uint8Array(doc.bytes), {
      headers: {
        "Content-Type": doc.meta.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${doc.meta.filename.replace(/"/g, "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
});

// Ștergerea unui scan înainte de expirarea retenției (dreptul de a șterge).
export const DELETE = observe<Ctx>("documents.delete", async (_req, { params }) => {
  try {
    const user = await requireUser();
    const { id } = await params;
    const ok = await deleteDocument(user.id, id);
    if (!ok) return NextResponse.json({ error: "inexistent" }, { status: 404 });
    return NextResponse.json({ deleted: true });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
});
