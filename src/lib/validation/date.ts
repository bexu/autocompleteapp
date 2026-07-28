// Validare dată calendaristică. Acceptă ISO (yyyy-mm-dd) și formatele RO uzuale
// (dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy). Verifică o dată REALĂ (nu doar forma):
// respinge 2026-02-30, 31.04.2026 etc. Fără dependențe externe.

function isRealYmd(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  if (y < 1900 || y > 2100) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function isValidDate(input: string): boolean {
  const s = input.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (iso) return isRealYmd(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const ro = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/.exec(s);
  if (ro) return isRealYmd(Number(ro[3]), Number(ro[2]), Number(ro[1]));

  return false;
}
