import { prisma } from "@/lib/db/prisma";
import { REMINDER_THRESHOLDS } from "./deadline";

// Tracking termen + remindere (partea cu DB). Termenul se calculează la crearea
// dosarului (vezi deadline.ts). Job pg-boss în src/jobs/ apelează `scanDueReminders`.

const DAY_MS = 24 * 60 * 60 * 1000;

export { computeNextDeadline, deadlineForManifest, REMINDER_THRESHOLDS } from "./deadline";

/**
 * Scanează dosarele „de depus" cu termen și creează remindere pentru pragurile
 * atinse (idempotent per dosar+prag). Întoarce numărul de remindere create nou.
 */
export async function scanDueReminders(now: Date = new Date()): Promise<number> {
  const dossiers = await prisma.dossier.findMany({
    where: { status: "DE_DEPUS", deadlineAt: { not: null, gt: now } },
  });

  const toCreate: {
    userId: string;
    dossierId: string;
    kind: string;
    formCode: string;
    deadlineAt: Date;
  }[] = [];

  for (const d of dossiers) {
    if (!d.deadlineAt) continue;
    const msLeft = d.deadlineAt.getTime() - now.getTime();
    for (const threshold of REMINDER_THRESHOLDS) {
      if (msLeft <= threshold * DAY_MS) {
        toCreate.push({
          userId: d.userId,
          dossierId: d.id,
          kind: `T${threshold}`,
          formCode: d.formCode,
          deadlineAt: d.deadlineAt,
        });
      }
    }
  }
  if (toCreate.length === 0) return 0;

  // skipDuplicates → idempotent pe (dossierId, kind), fără a înghiți alte erori.
  const res = await prisma.reminder.createMany({ data: toCreate, skipDuplicates: true });
  return res.count;
}

export interface ReminderView {
  id: string;
  formCode: string;
  kind: string;
  deadlineAt: Date;
}

export async function listReminders(userId: string): Promise<ReminderView[]> {
  const rows = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { deadlineAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    formCode: r.formCode,
    kind: r.kind,
    deadlineAt: r.deadlineAt,
  }));
}
