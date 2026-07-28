import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
} from "@/lib/forms/engine";
import { generateDecesCase } from "@/lib/deces/service";
import { DecesBodySchema } from "@/lib/forms/deces";
import { guardGeneration, RateLimitError, rateLimitResponse } from "@/lib/http/rate-limit";

// Dosar deces în familie: date decedat → ajutor de deces + pensie de urmaș.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    await guardGeneration(user.id);
    const body = await req.json().catch(() => ({}));
    const input = DecesBodySchema.parse(body);
    const result = await generateDecesCase(user.id, input);
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
}
