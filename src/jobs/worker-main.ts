import { PgBoss } from "pg-boss";
import { logger } from "@/lib/log/logger";
import { REMINDERS_QUEUE, runRemindersJob } from "./reminders";
import { RETENTION_QUEUE, runRetentionJob } from "./retention";

// Logica worker-ului pg-boss. Importată dinamic din worker.ts DUPĂ încărcarea
// mediului. Conexiune din DATABASE_URL.

export async function startWorker(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL lipsește pentru pg-boss.");

  const boss = new PgBoss({ connectionString });
  boss.on("error", (e: Error) => logger.error("pg-boss error", { name: e.name }));
  await boss.start();

  await boss.createQueue(REMINDERS_QUEUE);
  await boss.work(REMINDERS_QUEUE, async () => {
    await runRemindersJob();
  });

  await boss.createQueue(RETENTION_QUEUE);
  await boss.work(RETENTION_QUEUE, async () => {
    await runRetentionJob();
  });

  // Scanare zilnică a termenelor la 06:00; purjarea scanurilor expirate la 03:30.
  await boss.schedule(REMINDERS_QUEUE, "0 6 * * *");
  await boss.schedule(RETENTION_QUEUE, "30 3 * * *");

  logger.info("Worker pg-boss pornit", { queues: [REMINDERS_QUEUE, RETENTION_QUEUE] });
}
