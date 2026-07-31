import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
  previewForm,
} from "@/lib/forms/engine";
import { F230BodySchema } from "@/lib/forms/f230";

// Preview „exact ce semnezi": întoarce valorile mapate (pentru revizuire),
// fără a genera/semna. Owner-ul își vede propriile date peste sesiune.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const inputs = F230BodySchema.parse(body);
    const { fields, manifest } = await previewForm(user.id, { formCode: "230", inputs });
    return NextResponse.json({ title: manifest.title, fields });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "validare", fields: e.issues.map((i) => i.path.join(".")), details: e.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
        { status: 400 },
      );
    }
    if (e instanceof FormValidationError) {
      return NextResponse.json(
        { error: "validare", fields: e.errors.map((x) => x.key), details: e.errors.map((x) => ({ field: x.key, message: x.message })) },
        { status: 400 },
      );
    }
    if (e instanceof ManifestNotFoundError) {
      return NextResponse.json({ error: "formular indisponibil" }, { status: 404 });
    }
    throw e;
  }
}
