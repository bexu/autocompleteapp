import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { signForm } from "@/lib/forms/engine";
import { markSubmitted } from "@/lib/dispatch/repository";
import { listReminders, scanDueReminders } from "@/lib/reminders/service";

const benef = {
  beneficiarDenumire: "Asociația X",
  beneficiarCif: "12345678",
  beneficiarIban: "RO49AAAA1B31007593840000",
};

describe("remindere de termen (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 2).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({
      data: { id: `rem_${s}`, name: "R", email: `rem_${s}@example.com` },
    });
    userId = u.id;
    await upsertProfile(userId, { nume: "Ionescu", prenume: "Ana", cnp: "1960101223143" });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("dosarul semnat are termenul 25 mai calculat", async () => {
    // semnat pe 1 martie → termen 25 mai același an
    const signedAt = new Date("2026-03-01T10:00:00Z");
    const { dossierId } = await signForm(userId, { formCode: "230", inputs: benef }, signedAt);
    const d = await prisma.dossier.findUnique({ where: { id: dossierId } });
    expect(d?.deadlineAt?.toISOString().slice(0, 10)).toBe("2026-05-25");
  });

  it("scanarea creează remindere la praguri și e idempotentă", async () => {
    const { dossierId } = await signForm(
      userId,
      { formCode: "230", inputs: benef },
      new Date("2026-03-01T10:00:00Z"),
    );

    // La ~6 zile înainte de termen → pragurile T30 și T7 sunt atinse (nu T1).
    const now = new Date("2026-05-19T10:00:00Z");
    const created1 = await scanDueReminders(now);
    expect(created1).toBeGreaterThanOrEqual(2);

    const kinds = (await prisma.reminder.findMany({ where: { dossierId } })).map((r) => r.kind);
    expect(kinds).toEqual(expect.arrayContaining(["T30", "T7"]));
    expect(kinds).not.toContain("T1");

    // Re-rulare → fără duplicate (idempotent).
    const before = await prisma.reminder.count({ where: { dossierId } });
    await scanDueReminders(now);
    const after = await prisma.reminder.count({ where: { dossierId } });
    expect(after).toBe(before);

    // Reminderele apar în listă pentru user.
    const list = await listReminders(userId);
    expect(list.some((r) => r.formCode === "230")).toBe(true);
  });

  it("nu creează remindere pentru dosare deja depuse", async () => {
    const { dossierId } = await signForm(
      userId,
      { formCode: "230", inputs: benef },
      new Date("2026-03-01T10:00:00Z"),
    );
    await markSubmitted(userId, dossierId);
    const before = await prisma.reminder.count({ where: { dossierId } });
    await scanDueReminders(new Date("2026-05-24T10:00:00Z"));
    const after = await prisma.reminder.count({ where: { dossierId } });
    expect(after).toBe(before); // depus → fără remindere noi
  });
});
