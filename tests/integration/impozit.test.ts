import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { createImobil } from "@/lib/imobil/repository";
import { FormValidationError, generateAndFileForm } from "@/lib/forms/engine";
import { getDossier } from "@/lib/dispatch/repository";

describe("impozit imobil (integration, DB reală)", () => {
  let userId: string;
  let imobilId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 5).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `imp_${s}`, name: "I", email: `imp_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, { nume: "Ionescu", prenume: "Ana", cnp: "1960101223143" });
    const im = await createImobil(userId, { tip: "APARTAMENT", localitate: "Cluj-Napoca", nrCadastral: "12345" });
    imobilId = im.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("generează ITL-001 din profil + imobil și deschide un dosar", async () => {
    const { pdf, dossierId, manifest } = await generateAndFileForm(userId, {
      formCode: "ITL-001",
      jurisdiction: "cluj",
      imobilId,
      inputs: { dataDobandire: "2026-03-01", cotaParte: "1/1", valoareImpozabila: "250000" },
    });
    expect(manifest.id).toBe("ITL-001-cluj-2024");
    expect(Buffer.from(pdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    const d = await getDossier(userId, dossierId);
    expect(d?.status).toBe("DE_DEPUS");
    expect(d?.formCode).toBe("ITL-001");
  });

  it("respinge ITL-001 fără data dobândirii", async () => {
    await expect(
      generateAndFileForm(userId, { formCode: "ITL-001", jurisdiction: "cluj", imobilId, inputs: {} }),
    ).rejects.toBeInstanceOf(FormValidationError);
  });
});
