import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  listDocuments,
  saveDocument,
  type DocumentType,
} from "@/lib/documents/repository";
import { getOcrProvider, type IdCardFields } from "@/lib/ocr/provider";
import { logger } from "@/lib/log/logger";

// Upload document → stocare criptată + (pentru CI) extragere OCR. NU salvează
// nimic în profil — userul confirmă separat (PUT /api/profile). Rută cu PII →
// guard requireUser; nu logăm conținutul/câmpurile.

function bad(msg: string, status = 400): NextResponse {
  return NextResponse.json({ error: msg }, { status });
}

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ documents: await listDocuments(user.id) });
  } catch (e) {
    if (e instanceof UnauthorizedError) return bad("neautentificat", 401);
    logger.error("Eroare la GET /api/documents", {});
    return bad("eroare internă", 500);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const form = await req.formData();
    const file = form.get("file");
    const tip = String(form.get("tip") ?? "");

    if (!(file instanceof File)) return bad("Fișier lipsă.");
    if (!(DOCUMENT_TYPES as readonly string[]).includes(tip)) return bad("Tip invalid.");

    const bytes = Buffer.from(await file.arrayBuffer());
    if (bytes.length === 0) return bad("Fișier gol.");
    if (bytes.length > MAX_DOCUMENT_BYTES) return bad("Fișier prea mare.", 413);

    const meta = await saveDocument(user.id, {
      tip: tip as DocumentType,
      filename: file.name || "document",
      mimeType: file.type || "application/octet-stream",
      bytes,
    });

    // OCR doar pentru CI (extragere câmpuri de identitate).
    let extracted: IdCardFields | null = null;
    if (tip === "CI") {
      extracted = await getOcrProvider().extractIdCard(bytes);
    }

    return NextResponse.json({ document: meta, extracted });
  } catch (e) {
    if (e instanceof UnauthorizedError) return bad("neautentificat", 401);
    logger.error("Eroare la POST /api/documents", {});
    return bad("eroare internă", 500);
  }
}
