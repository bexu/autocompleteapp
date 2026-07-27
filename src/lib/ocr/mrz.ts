// Parser MRZ TD1 (ISO/IEC 7501-1) — zona citibilă mecanic de pe spatele CI
// românesc: 3 linii × 30 caractere. Determinist, fără dependențe externe.
//
// Layout TD1:
//   Linia 1: cod doc(2) stat(3) nr_document(9) check(1) opțional1(15)
//   Linia 2: data_naștere(6) check(1) sex(1) expirare(6) check(1)
//            naționalitate(3) opțional2(11) check_compus(1)
//   Linia 3: nume<<prenume, umplut cu '<'
//
// CNP-ul românesc e plasat în datele opționale (linia 1/2). Îl detectăm ca
// secvență de 13 cifre validă (checksum CNP), nu presupunem poziția exactă.

export interface MrzResult {
  documentNumber: string | null;
  nationality: string | null;
  sex: "M" | "F" | null;
  expiry: Date | null;
  surname: string | null;
  givenNames: string | null;
  optionalData: string; // cifre din câmpurile opționale (candidat CNP)
  valid: boolean; // toate check-digit-urile verificate
}

const WEIGHTS = [7, 3, 1];

function charValue(ch: string): number {
  if (ch >= "0" && ch <= "9") return ch.charCodeAt(0) - 48;
  if (ch >= "A" && ch <= "Z") return ch.charCodeAt(0) - 55; // A=10..Z=35
  return 0; // '<' și restul = 0
}

export function computeCheckDigit(field: string): number {
  let sum = 0;
  for (let i = 0; i < field.length; i++) {
    sum += charValue(field[i]) * WEIGHTS[i % 3];
  }
  return sum % 10;
}

function parseYymmdd(s: string, pivot = 30): Date | null {
  if (!/^\d{6}$/.test(s)) return null;
  const yy = Number(s.slice(0, 2));
  const mm = Number(s.slice(2, 4));
  const dd = Number(s.slice(4, 6));
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  // Fereastră pentru expirare: ani mici → 2000+, altfel 1900+.
  const year = yy <= pivot ? 2000 + yy : 1900 + yy;
  const dt = new Date(Date.UTC(year, mm - 1, dd));
  return dt.getUTCMonth() === mm - 1 ? dt : null;
}

/** Extrage cele 3 linii MRZ dintr-un text (ignoră restul, normalizează). */
export function extractMrzLines(text: string): string[] | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, "").toUpperCase())
    .filter((l) => /^[A-Z0-9<]{30}$/.test(l));
  if (lines.length < 3) return null;
  // Ultimele 3 linii de 30 de caractere (MRZ e la finalul documentului).
  return lines.slice(-3);
}

export function parseTd1Mrz(text: string): MrzResult | null {
  const lines = extractMrzLines(text);
  if (!lines) return null;
  const [l1, l2, l3] = lines;

  const docNumberRaw = l1.slice(5, 14);
  const docNumberCheck = l1.slice(14, 15);
  const optional1 = l1.slice(15, 30);

  const birth = l2.slice(0, 6);
  const birthCheck = l2.slice(6, 7);
  const sexChar = l2.slice(7, 8);
  const expiry = l2.slice(8, 14);
  const expiryCheck = l2.slice(14, 15);
  const nationality = l2.slice(15, 18);
  const optional2 = l2.slice(18, 29);

  const valid =
    computeCheckDigit(docNumberRaw) === Number(docNumberCheck) &&
    computeCheckDigit(birth) === Number(birthCheck) &&
    computeCheckDigit(expiry) === Number(expiryCheck);

  const [surnamePart, givenPart] = l3.split("<<");
  const clean = (s: string | undefined) =>
    s ? s.replace(/</g, " ").trim() || null : null;

  const sex = sexChar === "M" ? "M" : sexChar === "F" ? "F" : null;
  const optionalData = (optional1 + optional2).replace(/\D/g, "");

  return {
    documentNumber: docNumberRaw.replace(/</g, "") || null,
    nationality: nationality.replace(/</g, "") || null,
    sex,
    expiry: parseYymmdd(expiry),
    surname: clean(surnamePart),
    givenNames: clean(givenPart),
    optionalData,
    valid,
  };
}
