// Redactare PII înainte de logare. Regula de aur a proiectului: NICIODATĂ PII
// în loguri (CNP, nume, serie/nr CI, IBAN, email, telefon, venituri, scanuri).
// Vezi docs/threat-model.md și CLAUDE.md („Reguli de date").
//
// Două straturi de apărare, ambele obligatorii:
//   1. după numele cheii (denylist, potrivire pe fragment) — RO + EN + câmpuri
//      de framework (ex. better-auth `name`);
//   2. după tiparul valorii (pe orice string ȘI pe numere/bigint coercite) —
//      CNP, IBAN, email, telefon, serie+nr CI, dată calendaristică.

const REDACTED = "[REDACTED]";

// Chei considerate PII — potrivire case-insensitive, pe fragment de nume.
const PII_KEY_FRAGMENTS = [
  // RO
  "cnp",
  "nume",
  "prenume",
  "iban",
  "serie",
  "seria",
  "numar",
  "nr_ci",
  "ci_nr",
  "telefon",
  "adresa",
  "venit",
  "salariu",
  "suma",
  "parola",
  "nascut",
  "data_nasterii",
  "fisier",
  // EN / framework
  "name", // include firstname/lastname/fullname (și, acceptabil, username)
  "email",
  "phone",
  "address",
  "income",
  "salary",
  "wage",
  "iban",
  "password",
  "secret",
  "token",
  "apikey",
  "scan",
  "dob",
  "birthdate",
  "dateofbirth",
  "born",
];

// Tipare de valori care sunt PII indiferent de cheie. Aplicate în ordine;
// un match e înlocuit cu [REDACTED], deci tiparele ulterioare nu intră în el.
const VALUE_PATTERNS: RegExp[] = [
  // IBAN românesc, inclusiv format cu spații (RO49 AAAA 1B31 ...).
  /RO\d{2}(?:[ ]?[A-Z0-9]){16,20}/gi,
  // Email.
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  // CNP: 13 cifre.
  /\b\d{13}\b/g,
  // Telefon RO mobil: 07xx xxx xxx / +407... cu separatori opționali.
  /(?:\+?4?0)7\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g,
  // Serie + număr CI: două litere + 6 cifre (ex. XX123456, „XX 123456").
  /\b[A-Z]{2}\s?\d{6}\b/g,
  // Dată calendaristică dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy (ex. dată naștere).
  /\b\d{1,2}[.\/-]\d{1,2}[.\/-]\d{4}\b/g,
];

function isPiiKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PII_KEY_FRAGMENTS.some((frag) => lower.includes(frag));
}

function redactString(value: string): string {
  let out = value;
  for (const re of VALUE_PATTERNS) {
    out = out.replace(re, REDACTED);
  }
  return out;
}

function describeBinary(value: ArrayBufferView | ArrayBuffer): string {
  const len =
    value instanceof ArrayBuffer ? value.byteLength : value.byteLength;
  const name =
    value instanceof ArrayBuffer ? "ArrayBuffer" : value.constructor.name;
  return `[${name} len=${len}]`;
}

/**
 * Întoarce o copie a valorii cu PII redactat. Redactează după numele cheii
 * (recursiv), după tiparele de valoare (string + numere/bigint), și tratează
 * tipuri care altfel ar scurge sau ar strica logul (Buffer, Date, Map, Set).
 * Nu mutează inputul.
 */
export function redact(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") return redactString(value);

  if (typeof value === "number") {
    // Numerele pot purta PII (CNP ca parseInt). Redactăm doar dacă un tipar
    // se aplică; altfel păstrăm tipul numeric (durate, contoare, etc.).
    const s = String(value);
    const red = redactString(s);
    return red === s ? value : red;
  }

  // bigint nu e serializabil de JSON.stringify — întoarcem mereu string redactat.
  if (typeof value === "bigint") return redactString(String(value));

  if (value === null || typeof value !== "object") return value;

  // Tipuri „frunză" tratate special (înainte de urmărirea ciclurilor).
  if (Buffer.isBuffer(value)) return `[Buffer len=${value.length}]`;
  if (ArrayBuffer.isView(value)) return describeBinary(value);
  if (value instanceof ArrayBuffer) return describeBinary(value);
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, seen));
  }

  if (value instanceof Map) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of value) {
      const key = String(k);
      out[key] = isPiiKey(key) ? REDACTED : redact(v, seen);
    }
    return out;
  }

  if (value instanceof Set) {
    return Array.from(value, (item) => redact(item, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = isPiiKey(key) ? REDACTED : redact(val, seen);
  }
  return out;
}
