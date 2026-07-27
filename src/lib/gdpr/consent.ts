import { prisma } from "@/lib/db/prisma";
import { audit } from "./audit";

// Consimțământ per categorie de date. Temei legal explicit per categorie
// (CLAUDE.md „Reguli de date"). Fiecare acordare/retragere e auditată.

export const CONSENT_CATEGORIES = ["IDENTITATE", "DOCUMENTE", "CONTACT"] as const;
export type ConsentCategory = (typeof CONSENT_CATEGORIES)[number];

// Versiunea politicii de confidențialitate în vigoare. La schimbarea politicii,
// consimțămintele vechi rămân în ledger; se cere reacordare pe versiunea nouă.
export const CURRENT_POLICY_VERSION = "2026-07-27";

export interface ConsentStatus {
  category: ConsentCategory;
  granted: boolean;
  policyVersion: string | null;
  grantedAt: Date | null;
}

export function isConsentCategory(v: string): v is ConsentCategory {
  return (CONSENT_CATEGORIES as readonly string[]).includes(v);
}

/** Consimțământul activ pe versiunea curentă a politicii. */
export async function hasConsent(
  userId: string,
  category: ConsentCategory,
): Promise<boolean> {
  const active = await prisma.consent.findFirst({
    where: {
      userId,
      category,
      policyVersion: CURRENT_POLICY_VERSION,
      withdrawnAt: null,
    },
  });
  return active !== null;
}

export async function grantConsent(
  userId: string,
  category: ConsentCategory,
): Promise<void> {
  if (await hasConsent(userId, category)) return; // idempotent
  await prisma.consent.create({
    data: { userId, category, policyVersion: CURRENT_POLICY_VERSION },
  });
  await audit(userId, "CONSENT_GRANT", category);
}

export async function withdrawConsent(
  userId: string,
  category: ConsentCategory,
): Promise<void> {
  const res = await prisma.consent.updateMany({
    where: { userId, category, withdrawnAt: null },
    data: { withdrawnAt: new Date() },
  });
  if (res.count > 0) await audit(userId, "CONSENT_WITHDRAW", category);
}

/** Starea consimțământului pentru toate categoriile. */
export async function getConsentStatus(userId: string): Promise<ConsentStatus[]> {
  const active = await prisma.consent.findMany({
    where: { userId, policyVersion: CURRENT_POLICY_VERSION, withdrawnAt: null },
  });
  const byCategory = new Map(active.map((c) => [c.category, c]));

  return CONSENT_CATEGORIES.map((category) => {
    const c = byCategory.get(category);
    return {
      category,
      granted: c !== undefined,
      policyVersion: c?.policyVersion ?? null,
      grantedAt: c?.grantedAt ?? null,
    };
  });
}
