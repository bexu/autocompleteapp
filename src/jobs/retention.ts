import { purgeExpiredDocuments } from "@/lib/documents/repository";
import { purgeExpiredRateLimitWindows } from "@/lib/http/rate-limit";
import { logger } from "@/lib/log/logger";

// Job de retenție: șterge scanurile cu retenția expirată (GDPR art. 5(1)(e) —
// „retenție definită, ștergere scanuri după utilizare", vezi CLAUDE.md) și
// curăță ferestrele vechi de rate-limit. Idempotent. Rulat pe cron de pg-boss.
// Fără PII în loguri (doar contoare).

export const RETENTION_QUEUE = "retention-purge";

export async function runRetentionJob(now: Date = new Date()): Promise<number> {
  const purged = await purgeExpiredDocuments(now);
  const rateLimitWindows = await purgeExpiredRateLimitWindows(now);
  logger.info("Job retenție rulat", { purged, rateLimitWindows });
  return purged;
}
