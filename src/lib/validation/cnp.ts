// Validare CNP (Cod Numeric Personal) — structură + cifră de control.
// Algoritm oficial: cifra 13 = suma(cifre[0..11] * weight[i]) mod 11,
// cu 10 → 1. Weights: 2 7 9 1 4 6 3 5 8 2 7 9.

const CONTROL_WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

export function isValidCnp(cnp: string): boolean {
  if (!/^\d{13}$/.test(cnp)) return false;

  const digits = cnp.split("").map(Number);

  // S (prima cifră): 1-8 rezidenți, 9 străini. 0 invalid.
  if (digits[0] === 0) return false;

  // Luna 01-12.
  const month = digits[3] * 10 + digits[4];
  if (month < 1 || month > 12) return false;

  // Ziua 01-31 (validare de bază, nu per-lună).
  const day = digits[5] * 10 + digits[6];
  if (day < 1 || day > 31) return false;

  const sum = CONTROL_WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0);
  const control = sum % 11 === 10 ? 1 : sum % 11;

  return control === digits[12];
}

export interface CnpInfo {
  sex: "M" | "F" | null;
  birthDate: Date | null;
}

// Prima cifră (S) → secolul nașterii. 7/8 (rezidenți) și 9 (străini) nu codează
// secolul determinist — le lăsăm fără dată.
const CENTURY_BY_S: Record<number, number> = { 1: 1900, 2: 1900, 3: 1800, 4: 1800, 5: 2000, 6: 2000 };

/** Derivă sexul și data nașterii dintr-un CNP valid (null dacă e invalid). */
export function parseCnp(cnp: string): CnpInfo | null {
  if (!isValidCnp(cnp)) return null;
  const d = cnp.split("").map(Number);
  const s = d[0];

  const sex = s === 9 ? null : s % 2 === 1 ? "M" : "F";

  const century = CENTURY_BY_S[s];
  let birthDate: Date | null = null;
  if (century !== undefined) {
    const year = century + d[1] * 10 + d[2];
    const month = d[3] * 10 + d[4];
    const day = d[5] * 10 + d[6];
    const dt = new Date(Date.UTC(year, month - 1, day));
    // Verifică că data e reală (ex. respinge 31 februarie).
    if (
      dt.getUTCFullYear() === year &&
      dt.getUTCMonth() === month - 1 &&
      dt.getUTCDate() === day
    ) {
      birthDate = dt;
    }
  }

  return { sex, birthDate };
}
