import { NextResponse } from "next/server";

// Limitator simplu per-cheie (fereastră glisantă, in-memory). Backstop împotriva
// abuzului pe rutele autentificate de generare (creează blob-uri criptate +
// dosare la fiecare cerere). Limitare cunoscută: în deploy multi-instanță e
// per-instanță — mutarea pe un store partajat (Redis/Postgres) e task de
// hardening (H.3). Fără PII: cheia e userId-ul opac.

const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): boolean {
  const cutoff = now - windowMs;
  const recent = (hits.get(key) ?? []).filter((t) => t > cutoff);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

// Aruncat de rutele care depășesc pragul; prins ca 429 uniform.
export class RateLimitError extends Error {
  constructor() {
    super("Prea multe cereri");
    this.name = "RateLimitError";
  }
}

/** Verifică generarea per-user; aruncă RateLimitError la depășire. */
export function guardGeneration(userId: string, max = 30, windowMs = 60_000): void {
  if (!checkRateLimit(`gen:${userId}`, max, windowMs)) {
    throw new RateLimitError();
  }
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json({ error: "prea multe cereri" }, { status: 429 });
}
