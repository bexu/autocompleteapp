import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
  signForm,
} from "@/lib/forms/engine";

// Semnează (provider mock/QTSP) + arhivează criptat, apoi întoarce PDF-ul semnat.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const inputs = await req.json().catch(() => ({}));
    const { signedPdf, signedFormId, dossierId } = await signForm(user.id, {
      formCode: "230",
      inputs,
    });
    return new NextResponse(Buffer.from(signedPdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="formular-230-semnat.pdf"',
        "X-Signed-Form-Id": signedFormId,
        "X-Dossier-Id": dossierId,
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    if (e instanceof FormValidationError) {
      return NextResponse.json(
        { error: "validare", fields: e.errors.map((x) => x.key) },
        { status: 400 },
      );
    }
    if (e instanceof ManifestNotFoundError) {
      return NextResponse.json({ error: "formular indisponibil" }, { status: 404 });
    }
    throw e;
  }
}
