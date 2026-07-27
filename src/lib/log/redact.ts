// Redactare PII înainte de logare. Regula de aur a proiectului: NICIODATĂ PII
// în loguri (CNP, nume, serie/nr CI, IBAN, email, telefon, venituri, scanuri).
// Vezi docs/threat-model.md și CLAUDE.md („Reguli de date").

const REDACTED = "[REDACTED]";

// Chei considerate PII — potrivire case-insensitive, pe fragment de nume.
const PII_KEY_FRAGMENTS = [
  "cnp",
  "nume",
  "prenume",
  "iban",
  "serie",
  "seria",
  "numar",
  "nr_ci",
  "ci_nr",
  "email",
  "telefon",
  "phone",
  "adresa",
  "address",
  "venit",
  "salariu",
  "suma",
  "parola",
  "password",
  "secret",
  "token",
  "scan",
  "fisier",
  "data_nasterii",
  "birthdate",
];

// Tipare de valori care sunt PII indiferent de cheie.
const VALUE_PATTERNS: Array<{ re: RegExp; replace: string }> = [
  // CNP: 13 cifre.
  { re: /\b\d{13}\b/g, replace: REDACTED },
  // IBAN românesc: RO + 2 cifre + 4 litere/cifre + 16 caractere.
  { re: /\bRO\d{2}[A-Z0-9]{16,20}\b/gi, replace: REDACTED },
  // Email.
  { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replace: REDACTED },
];

function isPiiKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PII_KEY_FRAGMENTS.some((frag) => lower.includes(frag));
}

function redactString(value: string): string {
  let out = value;
  for (const { re, replace } of VALUE_PATTERNS) {
    out = out.replace(re, replace);
  }
  return out;
}

/**
 * Întoarce o copie a valorii cu PII redactat. Redactează după numele cheii
 * (recursiv pe obiecte/array-uri) și după tiparele de valoare (pe string-uri).
 * Nu mutează inputul.
 */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return redactString(value);
  if (value === null || typeof value !== "object") return value;

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isPiiKey(key) ? REDACTED : redact(val, seen);
  }
  return out;
}
