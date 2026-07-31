import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { MAX_DOCUMENT_BYTES, saveDocument } from "@/lib/documents/repository";
import { getVehicleOcrProvider } from "@/lib/ocr/civ";
import { ConsentRequiredError, requireConsent } from "@/lib/gdpr/consent";
import { guardGeneration, RateLimitError } from "@/lib/http/rate-limit";

// Upload CIV → stocare criptată (seif) + extragere câmpuri vehicul. NU salvează
// vehiculul — userul confirmă separat (POST /api/vehicule). Fără PII în loguri.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await guardGeneration(user.id);
    await requireConsent(user.id, "DOCUMENTE");

    // Mărimea se refuză înainte de a citi corpul cererii.
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_DOCUMENT_BYTES * 2) {
      return NextResponse.json({ error: "Fișier prea mare." }, { status: 413 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Fișier lipsă." }, { status: 400 });
    }
    if (file.size === 0) return NextResponse.json({ error: "Fișier gol." }, { status: 400 });
    if (file.size > MAX_DOCUMENT_BYTES) {
      return NextResponse.json({ error: "Fișier prea mare." }, { status: 413 });
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
    const extracted = await getVehicleOcrProvider().extractVehicle(bytes);

    return NextResponse.json({ document: meta, extracted });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    if (e instanceof RateLimitError) {
      return NextResponse.json({ error: "prea multe cereri" }, { status: 429 });
    }
    if (e instanceof ConsentRequiredError) {
      return NextResponse.json({ error: "consimțământ necesar", category: e.category }, { status: 403 });
    }
    throw e;
  }
}
