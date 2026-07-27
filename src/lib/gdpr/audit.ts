import { prisma } from "@/lib/db/prisma";

// Audit log de conformitate: cine (id opac) / ce / când. NICIODATĂ PII.
// Supraviețuiește ștergerii contului (fără FK) — dovadă că acțiunea a avut loc.

export const AUDIT_ACTIONS = [
  "CONSENT_GRANT",
  "CONSENT_WITHDRAW",
  "DATA_EXPORT",
  "DATA_DELETE",
  "ACCOUNT_DELETE",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/**
 * Scrie o intrare de audit. `detail` trebuie să fie neutru (cod categorie,
 * număr) — nu trece niciodată nume, CNP sau alt PII aici.
 */
export async function audit(
  userId: string | null,
  action: AuditAction,
  detail?: string,
): Promise<void> {
  await prisma.auditLog.create({ data: { userId, action, detail: detail ?? null } });
}
