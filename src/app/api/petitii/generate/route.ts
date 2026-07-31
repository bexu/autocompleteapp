import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
} from "@/lib/forms/engine";
import { generatePetitie } from "@/lib/petitii/service";
import { PetitieBodySchema } from "@/lib/forms/petitii";
import { guardGeneration, RateLimitError, rateLimitResponse } from "@/lib/http/rate-limit";

// Builder petiții: profil + text → o cerere generată + dosar de depus.
import { observe } from "@/lib/http/observe";

export const POST = observe("petitii.generate", async (req: Request) => {
  try {
    const user = await requireUser();
    await guardGeneration(user.id);
    const body = await req.json().catch(() => ({}));
    const input = PetitieBodySchema.parse(body);
    const result = await generatePetitie(user.id, input);
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
    }
    if (e instanceof RateLimitError) return rateLimitResponse();
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: "validare", fields: e.issues.map((i) => i.path.join(".")), details: e.issues.map((i) => ({ field: i.path.join("."), message: i.message })) },
        { status: 400 },
      );
    }
    if (e instanceof FormValidationError) {
      return NextResponse.json(
        { error: "validare", fields: e.errors.map((x) => x.key), details: e.errors.map((x) => ({ field: x.key, message: x.message })) },
        { status: 400 },
      );
    }
    if (e instanceof ManifestNotFoundError) {
      return NextResponse.json({ error: "formular indisponibil" }, { status: 404 });
    }
    throw e;
  }
});
