import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { listDocuments, saveDocument } from "@/lib/documents/repository";
import { runRetentionJob } from "@/jobs/retention";

// Regresie pentru finding-ul de audit: purjarea scanurilor expirate exista dar
// nu era programată nicăieri. Jobul de retenție trebuie să șteargă doar scanurile
// cu retenția expirată (GDPR art. 5(1)(e)).
describe("job retenție (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 7).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `ret_${s}`, name: "R", email: `ret_${s}@ex.com` } });
    userId = u.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("runRetentionJob șterge scanurile expirate, le păstrează pe cele valide", async () => {
    const past = new Date("2000-01-01T00:00:00.000Z");
    const expired = await saveDocument(userId, {
      tip: "CI",
      filename: "vechi.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("vechi"),
      retentionDays: 1,
      now: past, // retainUntil = 2000-01-02 → demult expirat
    });
    const valid = await saveDocument(userId, {
      tip: "CI",
      filename: "nou.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("nou"),
      retentionDays: 30,
    });

    const purged = await runRetentionJob(new Date());
    expect(purged).toBeGreaterThanOrEqual(1);

    const ids = (await listDocuments(userId)).map((d) => d.id);
    expect(ids).not.toContain(expired.id);
    expect(ids).toContain(valid.id);
  });
});
