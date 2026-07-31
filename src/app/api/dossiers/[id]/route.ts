import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import { deleteDossier } from "@/lib/dispatch/repository";
import { observe } from "@/lib/http/observe";

// Șterge un dosar greșit (împreună cu documentul arhivat și reminderele lui).
export const DELETE = observe<[{ params: Promise<{ id: string }> }]>(
  "dossiers.delete",
  async (_req, { params }) => {
    try {
      const user = await requireUser();
      const { id } = await params;
      const ok = await deleteDossier(user.id, id);
      if (!ok) return NextResponse.json({ error: "inexistent" }, { status: 404 });
      return NextResponse.json({ deleted: true });
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return NextResponse.json({ error: "neautentificat" }, { status: 401 });
      }
      throw e;
    }
  },
);
