import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { MAX_DOCUMENT_BYTES, saveDocument } from "@/lib/documents/repository";
import { getVehicleOcrProvider } from "@/lib/ocr/civ";

// Upload CIV → stocare criptată (seif) + extragere câmpuri vehicul. NU salvează
// vehiculul — userul confirmă separat (POST /api/vehicule). Fără PII în loguri.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fișier lipsă." }, { status: 400 });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length === 0) return NextResponse.json({ error: "Fișier gol." }, { status: 400 });
    if (bytes.length > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "Fișier prea mare." }, { status: 413 });
    }

    const meta = await saveDocument(user.id, {
      tip: "CIV",
      filename: file.name || "civ",
      mimeType: file.type || "application/octet-stream",
      bytes,
    });
    const extracted = await getVehicleOcrProvider().extractVehicle(bytes, file.type);

    return NextResponse.json({ document: meta, extracted });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
}
