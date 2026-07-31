import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { createImobil, listImobile } from "@/lib/imobil/repository";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json({ imobile: await listImobile(user.id) });
  } catch (e) {
    return handle(e);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const imobil = await createImobil(user.id, body);
    return NextResponse.json({ imobil });
  } catch (e) {
    return handle(e);
  }
}

function handle(e: unknown): NextResponse {
  if (e instanceof UnauthorizedError) {
    return NextResponse.json({ error: "neautentificat" }, { status: 401 });
  }
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: "validare", fields: e.issues.map((i) => i.path.join(".")), details: e.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  throw e;
}
