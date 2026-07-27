import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
  generateForm,
} from "@/lib/forms/engine";

// Generează PDF-ul formularului 230 din profil + entitatea beneficiară.
// Rută cu PII → guard. Nu logăm inputurile/PDF-ul.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const inputs = await req.json().catch(() => ({}));

    const { pdf } = await generateForm(user.id, { formCode: "230", inputs });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="formular-230.pdf"',
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
