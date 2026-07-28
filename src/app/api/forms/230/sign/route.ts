import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
  signForm,
} from "@/lib/forms/engine";
import { F230BodySchema } from "@/lib/forms/f230";
import { guardGeneration, RateLimitError, rateLimitResponse } from "@/lib/http/rate-limit";

// Semnează (provider mock/QTSP) + arhivează criptat, apoi întoarce PDF-ul semnat.
import { observe } from "@/lib/http/observe";

export const POST = observe("230.sign", async (req: Request) => {
  try {
    const user = await requireUser();
    await guardGeneration(user.id);
    const body = await req.json().catch(() => ({}));
    const inputs = F230BodySchema.parse(body);
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
    if (e instanceof RateLimitError) return rateLimitResponse();
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "validare", fields: e.issues.map((i) => i.path.join(".")) },
        { status: 400 },
      );
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
});
