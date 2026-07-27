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
