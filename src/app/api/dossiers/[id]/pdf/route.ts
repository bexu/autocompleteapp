import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { getDossier } from "@/lib/dispatch/repository";
import { getSignedFormContent } from "@/lib/signature/repository";
import { observe } from "@/lib/http/observe";

// Descarcă documentul arhivat al unui dosar (decriptat la cerere, doar pentru
// proprietar). Verificare de proprietate pe ambele niveluri: dosarul e al
// userului, iar `getSignedFormContent` re-verifică proprietatea documentului.
export const GET = observe<[{ params: Promise<{ id: string }> }]>(
  "dossiers.pdf",
  async (_req, { params }) => {
    try {
      const user = await requireUser();
      const { id } = await params;

      const dossier = await getDossier(user.id, id);
      if (!dossier?.signedFormId) {
        return NextResponse.json({ error: "inexistent" }, { status: 404 });
      }

      const content = await getSignedFormContent(user.id, dossier.signedFormId);
      if (!content) {
        return NextResponse.json({ error: "inexistent" }, { status: 404 });
      }

      const filename = `${dossier.formCode.toLowerCase()}.pdf`;
      return new NextResponse(new Uint8Array(content.bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          // Document cu date personale — fără cache în proxy/browser.
          "Cache-Control": "private, no-store",
        },
      });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return NextResponse.json({ error: "neautentificat" }, { status: 401 });
      }
      throw e;
    }
  },
);
