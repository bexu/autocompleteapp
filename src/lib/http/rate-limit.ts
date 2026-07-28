import { NextResponse } from "next/server";

// Backstop împotriva abuzului pe rutele autentificate de generare (fiecare cerere
// creează un blob criptat + un dosar). Cheile sunt opace (ex. „gen:<userId>") —
// FĂRĂ PII în tabel/loguri.

// --- Variantă in-memory (fereastră glisantă) — folosită în teste + ca fallback.
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

// --- Variantă distribuită (Postgres, fereastră fixă) — partajată între instanțe.
// Contor atomic pe (cheie, început-de-fereastră) prin upsert + increment.
export async function checkRateLimitDb(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<boolean> {
  // Import lazy: modulul rămâne fără dependență de DB pentru varianta in-memory
  // (unit tests) — prisma.ts cere DATABASE_URL la încărcare.
  const { prisma } = await import("@/lib/db/prisma");
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);
  const row = await prisma.rateLimitWindow.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, count: 1 },
    update: { count: { increment: 1 } },
  });
  return row.count <= max;
}

// Aruncat de rutele care depășesc pragul; prins ca 429 uniform.
export class RateLimitError extends Error {
  constructor() {
    super("Prea multe cereri");
    this.name = "RateLimitError";
  }
}

/**
 * Verifică generarea per-user (distribuit, Postgres); aruncă RateLimitError la
 * depășire. Limitare fixed-window: la granița ferestrei se poate ajunge scurt
 * până la ~2×max — acceptabil pentru un backstop.
 */
export async function guardGeneration(
  userId: string,
  max = 30,
  windowMs = 60_000,
): Promise<void> {
  const ok = await checkRateLimitDb(`gen:${userId}`, max, windowMs);
  if (!ok) throw new RateLimitError();
}

/** Curăță ferestrele expirate (apelat de jobul de retenție). */
export async function purgeExpiredRateLimitWindows(now: Date = new Date()): Promise<number> {
  const { prisma } = await import("@/lib/db/prisma");
  const cutoff = new Date(now.getTime() - 3_600_000); // păstrează ~1h
  const res = await prisma.rateLimitWindow.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  return res.count;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json({ error: "prea multe cereri" }, { status: 429 });
}
