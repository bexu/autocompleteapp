import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
} from "@/lib/forms/engine";
import { generateAutoCase } from "@/lib/auto/service";
import { AutoWizardSchema } from "@/lib/auto/event";

// Wizard auto: eveniment + vehicul → generează setul de documente + dosare.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const input = AutoWizardSchema.parse(body);
    const result = await generateAutoCase(user.id, input);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "validare", fields: e.issues.map((i) => i.path.join(".")) },
        { status: 400 },
      );
    }
    if (e instanceof FormValidationError) {
      return NextResponse.json(
        { error: "validare", fields: e.errors.map((x) => x.key) },
        { status: 400 },
      );
    }
    if (e instanceof ManifestNotFoundError) {
      return NextResponse.json({ error: "formular indisponibil" }, { status: 404 });
    }
    throw e;
  }
}
