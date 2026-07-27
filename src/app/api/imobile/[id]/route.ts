import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { deleteImobil, updateImobil } from "@/lib/imobil/repository";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const imobil = await updateImobil(user.id, id, body);
    if (!imobil) return NextResponse.json({ error: "inexistent" }, { status: 404 });
    return NextResponse.json({ imobil });
  } catch (e) {
    return handle(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const ok = await deleteImobil(user.id, id);
    if (!ok) return NextResponse.json({ error: "inexistent" }, { status: 404 });
    return NextResponse.json({ deleted: true });
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
      { error: "validare", fields: e.issues.map((i) => i.path.join(".")) },
      { status: 400 },
    );
  }
  throw e;
}
