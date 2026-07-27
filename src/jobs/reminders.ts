import { scanDueReminders } from "@/lib/reminders/service";
import { logger } from "@/lib/log/logger";

// Job de remindere: scanează dosarele „de depus" cu termen apropiat și creează
// remindere. Idempotent. Rulat pe cron de pg-boss (vezi src/jobs/worker.ts).
// Fără PII în loguri.

export const REMINDERS_QUEUE = "reminders-scan";

export async function runRemindersJob(now: Date = new Date()): Promise<number> {
  const created = await scanDueReminders(now);
  logger.info("Job remindere rulat", { created });
  return created;
}
