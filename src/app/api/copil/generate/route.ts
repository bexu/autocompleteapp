import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
} from "@/lib/forms/engine";
import { generateCopilCase } from "@/lib/copil/service";
import { COPIL_BODY_SCHEMA } from "@/lib/forms/copil";
import { guardGeneration, RateLimitError, rateLimitResponse } from "@/lib/http/rate-limit";

// Dosar nou-născut: date copil + angajator → alocație + indemnizație.
import { observe } from "@/lib/http/observe";

export const POST = observe("copil.generate", async (req: Request) => {
  try {
    const user = await requireUser();
    await guardGeneration(user.id);
    const body = await req.json().catch(() => ({}));
    const input = COPIL_BODY_SCHEMA.parse(body);
    const result = await generateCopilCase(user.id, input);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    if (e instanceof RateLimitError) return rateLimitResponse();
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
});
