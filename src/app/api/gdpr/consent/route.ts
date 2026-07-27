import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  getConsentStatus,
  grantConsent,
  isConsentCategory,
  withdrawConsent,
} from "@/lib/gdpr/consent";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ consents: await getConsentStatus(user.id) });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const category = String(body.category ?? "");
    const action = String(body.action ?? "");

    if (!isConsentCategory(category)) {
      return NextResponse.json({ error: "categorie invalidă" }, { status: 400 });
    }
    if (action === "grant") await grantConsent(user.id, category);
    else if (action === "withdraw") await withdrawConsent(user.id, category);
    else return NextResponse.json({ error: "acțiune invalidă" }, { status: 400 });

    return NextResponse.json({ consents: await getConsentStatus(user.id) });
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    throw e;
  }
}
