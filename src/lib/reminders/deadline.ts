import { getManifestById } from "@/lib/forms/registered";

// Logică pură de termen (fără DB) — testabilă unitar.

// Praguri de reminder (zile înainte de termen).
export const REMINDER_THRESHOLDS = [30, 7, 1] as const;

/** Următoarea apariție a (lună, zi) la sau după `from` (UTC). */
export function computeNextDeadline(
  rule: { month: number; day: number },
  from: Date,
): Date {
  const year = from.getUTCFullYear();
  // Comparăm la granularitate de ZI („la sau după" termen): dacă semnezi în
  // cursul zilei termenului, rămâne aceeași dată, nu sare în anul următor.
  const fromDay = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  let d = new Date(Date.UTC(year, rule.month - 1, rule.day));
  if (d.getTime() < fromDay) {
    d = new Date(Date.UTC(year + 1, rule.month - 1, rule.day));
  }
  return d;
}

/** Termenul unui dosar din manifest (null dacă manifestul n-are regulă). */
export function deadlineForManifest(manifestId: string, from: Date): Date | null {
  const manifest = getManifestById(manifestId);
  if (!manifest?.deadlineRule) return null;
  return computeNextDeadline(manifest.deadlineRule, from);
}
