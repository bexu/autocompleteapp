// Validare IBAN — mod-97 (ISO 13616) + lungime pe țară (RO = 24).
// Normalizează spațiile; nu depinde de o bibliotecă externă.

const COUNTRY_LENGTHS: Record<string, number> = {
  RO: 24,
};

export function normalizeIban(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

export function isValidIban(input: string): boolean {
  const iban = normalizeIban(input);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) return false;

  const country = iban.slice(0, 2);
  const expectedLen = COUNTRY_LENGTHS[country];
  if (expectedLen !== undefined && iban.length !== expectedLen) return false;
  if (iban.length < 15 || iban.length > 34) return false;

  // Mută primele 4 caractere la coadă, transformă literele în numere (A=10..Z=35).
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged
    .split("")
    .map((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 65 && code <= 90 ? String(code - 55) : ch;
    })
    .join("");

  return mod97(numeric) === 1;
}

// mod 97 pe un număr mare, procesat pe bucăți (evită BigInt).
function mod97(numeric: string): number {
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    const block = String(remainder) + numeric.slice(i, i + 7);
    remainder = Number(block) % 97;
  }
  return remainder;
}
