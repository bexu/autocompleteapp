import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { createImobil } from "@/lib/imobil/repository";
import { FormValidationError, generateAndFileForm } from "@/lib/forms/engine";
import { getDossier } from "@/lib/dispatch/repository";

describe("C168 (integration, DB reală)", () => {
  let userId: string;
  let imobilId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 4).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `c168_${s}`, name: "C", email: `c168_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, { nume: "Ionescu", prenume: "Ana", cnp: "1960101223143" });
    const im = await createImobil(userId, { tip: "APARTAMENT", localitate: "Cluj-Napoca", strada: "Memorandumului", nrCadastral: "12345" });
    imobilId = im.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const contract = {
    tipOperatiune: "Înregistrare",
    chiriasNume: "Popescu Dan",
    chiriasCnp: "5000101123457",
    chirie: "1500",
    moneda: "RON",
    perioadaStart: "2026-08-01",
    dataContract: "2026-07-27",
  };

  it("generează C168 din profil + imobil + contract și deschide un dosar", async () => {
    const { pdf, dossierId, manifest } = await generateAndFileForm(userId, {
      formCode: "C168",
      imobilId,
      inputs: contract,
    });
    expect(manifest.id).toBe("C168-national-2025");
    expect(Buffer.from(pdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    const d = await getDossier(userId, dossierId);
    expect(d?.status).toBe("DE_DEPUS");
    expect(d?.formCode).toBe("C168");
  });

  it("respinge generarea fără imobil (câmpuri obligatorii lipsă)", async () => {
    await expect(
      generateAndFileForm(userId, { formCode: "C168", inputs: contract }),
    ).rejects.toBeInstanceOf(FormValidationError);
  });
});
