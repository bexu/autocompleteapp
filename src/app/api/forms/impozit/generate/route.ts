import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
  generateAndFileForm,
} from "@/lib/forms/engine";
import { ImpozitBodySchema } from "@/lib/forms/impozit";
import { guardGeneration, RateLimitError, rateLimitResponse } from "@/lib/http/rate-limit";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    guardGeneration(user.id);
    const body = await req.json().catch(() => ({}));
    const { formCode, imobilId, ...inputs } = ImpozitBodySchema.parse(body);
    const { pdf, dossierId } = await generateAndFileForm(user.id, {
      formCode,
      jurisdiction: "cluj",
      imobilId,
      inputs,
    });
    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${formCode.toLowerCase()}.pdf"`,
        "X-Dossier-Id": dossierId,
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    if (e instanceof RateLimitError) return rateLimitResponse();
    if (e instanceof ZodError) return NextResponse.json({ error: "validare", fields: e.issues.map((i) => i.path.join(".")) }, { status: 400 });
    if (e instanceof FormValidationError) return NextResponse.json({ error: "validare", fields: e.errors.map((x) => x.key) }, { status: 400 });
    if (e instanceof ManifestNotFoundError) return NextResponse.json({ error: "formular indisponibil" }, { status: 404 });
    throw e;
  }
}
