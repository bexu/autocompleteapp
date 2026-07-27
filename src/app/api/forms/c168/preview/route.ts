import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
  previewForm,
} from "@/lib/forms/engine";
import { C168BodySchema } from "@/lib/forms/c168";

// Preview „exact ce semnezi" pentru C168.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const { imobilId, ...inputs } = C168BodySchema.parse(body);
    const { fields, manifest } = await previewForm(user.id, {
      formCode: "C168",
      imobilId,
      inputs,
    });
    return NextResponse.json({ title: manifest.title, fields });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    if (e instanceof ZodError) {
      return NextResponse.json({ error: "validare", fields: e.issues.map((i) => i.path.join(".")) }, { status: 400 });
    }
    if (e instanceof FormValidationError) {
      return NextResponse.json({ error: "validare", fields: e.errors.map((x) => x.key) }, { status: 400 });
    }
    if (e instanceof ManifestNotFoundError) {
      return NextResponse.json({ error: "formular indisponibil" }, { status: 404 });
    }
    throw e;
  }
}
