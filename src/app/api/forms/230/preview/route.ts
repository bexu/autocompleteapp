import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
  previewForm,
} from "@/lib/forms/engine";

// Preview „exact ce semnezi": întoarce valorile mapate (pentru revizuire),
// fără a genera/semna. Owner-ul își vede propriile date peste sesiune.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const inputs = await req.json().catch(() => ({}));
    const { fields, manifest } = await previewForm(user.id, { formCode: "230", inputs });
    return NextResponse.json({ title: manifest.title, fields });
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
