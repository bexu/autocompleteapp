import { purgeExpiredDocuments } from "@/lib/documents/repository";
import { logger } from "@/lib/log/logger";

// Job de retenție: șterge scanurile cu retenția expirată (GDPR art. 5(1)(e) —
// „retenție definită, ștergere scanuri după utilizare", vezi CLAUDE.md).
// Idempotent. Rulat pe cron de pg-boss. Fără PII în loguri (doar contorul).

export const RETENTION_QUEUE = "retention-purge";

export async function runRetentionJob(now: Date = new Date()): Promise<number> {
  const purged = await purgeExpiredDocuments(now);
  logger.info("Job retenție rulat", { purged });
  return purged;
}
