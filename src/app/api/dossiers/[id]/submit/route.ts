import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { markSubmitted } from "@/lib/dispatch/repository";

// Userul declară dosarul depus („generate, don't submit" — noi nu depunem).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const dossier = await markSubmitted(user.id, id);
    if (!dossier) return NextResponse.json({ error: "inexistent" }, { status: 404 });
    return NextResponse.json({ dossier });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
}
