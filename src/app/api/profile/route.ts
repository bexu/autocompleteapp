import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getProfile, upsertProfile } from "@/lib/profile/repository";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { logger } from "@/lib/log/logger";

// API profil pentru utilizatorul curent. Rută cu date personale → guard RBAC.
// Nu logăm niciodată body-ul/răspunsul (PII).

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await getProfile(user.id);
    return NextResponse.json({ profile });
  } catch (e) {
    return handleError(e, "GET");
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const profile = await upsertProfile(user.id, body);
    return NextResponse.json({ profile });
  } catch (e) {
    return handleError(e, "PUT");
  }
}

function handleError(e: unknown, op: string): NextResponse {
  if (e instanceof UnauthorizedError) {
    return NextResponse.json({ error: "neautentificat" }, { status: 401 });
  }
  if (e instanceof ZodError) {
    // Doar path-urile câmpurilor, fără valorile (PII).
    const fields = e.issues.map((i) => i.path.join("."));
    return NextResponse.json({ error: "validare", fields }, { status: 400 });
  }
  logger.error("Eroare la /api/profile", { op });
  return NextResponse.json({ error: "eroare internă" }, { status: 500 });
}
