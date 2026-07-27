import { z } from "zod";

// Validare de config la granița procesului. Secretele vin DOAR din mediu
// (env/vault) — niciodată hardcodate. Vezi docs/adr/0004-secrete-config.md.
// Acest modul e server-only; nu-l importa în cod care ajunge în browser.

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Bază de date
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL lipsește")
    .startsWith("postgresql://", "DATABASE_URL trebuie să fie o conexiune postgresql://"),

  // Cheia master pentru envelope encryption (task 0.3): 32 bytes, base64.
  // În prod e obligatorie; în dev/test poate lipsi până la folosirea criptării.
  ENCRYPTION_MASTER_KEY: z
    .string()
    .refine(
      (v) => v === "" || isValidBase64Key(v, 32),
      "ENCRYPTION_MASTER_KEY trebuie să fie 32 de bytes codate base64",
    )
    .optional()
    .default(""),

  // Autentificare (better-auth) — obligatorii doar când proiectul are auth.
  BETTER_AUTH_SECRET: z.string().optional().default(""),
  BETTER_AUTH_URL: z.string().url().optional().default("http://localhost:3000"),

  // Email tranzacțional — opțional.
  RESEND_API_KEY: z.string().optional().default(""),
});

export type Env = z.infer<typeof EnvSchema>;

function isValidBase64Key(value: string, expectedBytes: number): boolean {
  try {
    return Buffer.from(value, "base64").length === expectedBytes;
  } catch {
    return false;
  }
}

let cached: Env | null = null;

/**
 * Config validat, memoizat. Aruncă la prima accesare dacă mediul e invalid —
 * fail fast, fără a scurge valorile secrete în mesajul de eroare.
 */
export function getEnv(): Env {
  if (cached) return cached;

  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(
      `Config de mediu invalid. Câmpuri cu probleme: ${fields}. ` +
        `Completează .env după .env.example (fără a scurge valorile în loguri).`,
    );
  }

  // Reguli suplimentare, doar în producție (dev/test rulează fără secrete reale).
  if (parsed.data.NODE_ENV === "production") {
    const missing: string[] = [];
    if (parsed.data.ENCRYPTION_MASTER_KEY === "") missing.push("ENCRYPTION_MASTER_KEY");
    if (parsed.data.BETTER_AUTH_SECRET.length < 32) missing.push("BETTER_AUTH_SECRET");
    if (missing.length > 0) {
      throw new Error(
        `Config de producție incomplet: ${missing.join(", ")} sunt obligatorii în production.`,
      );
    }
  }

  cached = parsed.data;
  return cached;
}

/** Doar pentru teste: resetează cache-ul între cazuri. */
export function resetEnvCache(): void {
  cached = null;
}

const MASTER_KEY_BYTES = 32;

/**
 * Cheia master pentru criptare, validată separat de restul config-ului —
 * criptarea per-câmp nu trebuie să depindă de DATABASE_URL sau de alte secrete.
 * Aruncă dacă lipsește sau nu are 32 de bytes.
 */
export function getEncryptionMasterKey(): Buffer {
  const raw = process.env.ENCRYPTION_MASTER_KEY ?? "";
  if (raw === "") {
    throw new Error(
      "ENCRYPTION_MASTER_KEY lipsește — criptarea per-câmp nu poate rula. " +
        "Setează o cheie de 32 bytes base64 (openssl rand -base64 32).",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== MASTER_KEY_BYTES) {
    throw new Error("ENCRYPTION_MASTER_KEY trebuie să aibă exact 32 bytes.");
  }
  return key;
}
