import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/auth/session";
import {
  FormValidationError,
  ManifestNotFoundError,
} from "@/lib/forms/engine";
import { generateAutoCase } from "@/lib/auto/service";
import { isAutoEvent } from "@/lib/auto/event";

// Wizard auto: eveniment + vehicul → generează setul de documente + dosare.
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => ({}));
    const event = String(body.event ?? "");
    const vehicleId = String(body.vehicleId ?? "");

    if (!isAutoEvent(event)) {
      return NextResponse.json({ error: "eveniment invalid" }, { status: 400 });
    }
    if (!vehicleId) {
      return NextResponse.json({ error: "vehicul lipsă" }, { status: 400 });
    }

    const result = await generateAutoCase(user.id, {
      event,
      vehicleId,
      contrapartaNume: body.contrapartaNume,
      contrapartaCnp: body.contrapartaCnp,
      pret: body.pret,
      data: body.data,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return NextResponse.json({ error: "neautentificat" }, { status: 401 });
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
