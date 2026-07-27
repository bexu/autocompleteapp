import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { deleteAccount, deleteUserData } from "@/lib/gdpr/delete";

// Dreptul la ștergere. scope: "data" (păstrează contul) | "account" (șterge tot).
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const scope = String(body.scope ?? "data");

    if (scope === "account") {
      await deleteAccount(user.id);
      return NextResponse.json({ deleted: "account" });
    }
    if (scope === "data") {
      await deleteUserData(user.id);
      return NextResponse.json({ deleted: "data" });
    }
    return NextResponse.json({ error: "scope invalid" }, { status: 400 });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
}
