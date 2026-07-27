import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { createVehicul } from "@/lib/vehicle/repository";
import { generateAutoCase } from "@/lib/auto/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("dosar auto (integration, DB reală)", () => {
  let userId: string;
  let vehiculId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 3).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `ac_${s}`, name: "A", email: `ac_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu",
      prenume: "Ana",
      cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
    const v = await createVehicul(userId, {
      vin: "WBA3A5C50FF123456",
      marca: "BMW",
      model: "320d",
      nrInmatriculare: "CJ 12 ABC",
      normaPoluare: "Euro 6",
      emisiiCo2GKm: "120",
      putereKw: "140",
    });
    vehiculId = v.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("VANZARE generează ITL-010 + ITL-054 + ITL-016, fiecare cu dosar 'de depus'", async () => {
    const result = await generateAutoCase(userId, {
      event: "VANZARE",
      vehicleId: vehiculId,
      contrapartaNume: "Popescu Dan",
      contrapartaCnp: "5000101123457",
      pret: "15000",
      data: "2026-03-01",
    });

    expect(result.forms.map((f) => f.formCode)).toEqual(["ITL-010", "ITL-054", "ITL-016"]);
    expect(result.checklist.length).toBeGreaterThanOrEqual(3);

    for (const f of result.forms) {
      const d = await getDossier(userId, f.dossierId);
      expect(d?.status).toBe("DE_DEPUS");
      expect(d?.formCode).toBe(f.formCode);
    }
  });

  it("CUMPARARE generează ITL-005 + DGPCI", async () => {
    const result = await generateAutoCase(userId, {
      event: "CUMPARARE",
      vehicleId: vehiculId,
      data: "2026-03-01",
    });
    expect(result.forms.map((f) => f.formCode)).toEqual(["ITL-005", "DGPCI"]);
  });

  it("atomicitate: o validare eșuată NU lasă dosare orfane (ITL-010 nu se creează)", async () => {
    const before = await prisma.dossier.count({ where: { userId } });
    const signedBefore = await prisma.signedForm.count({ where: { userId } });

    // VANZARE fără datele cumpărătorului → ITL-054 e invalid; validarea trebuie
    // să pice ÎNAINTE de a persista ITL-010 (primul din set).
    await expect(
      generateAutoCase(userId, { event: "VANZARE", vehicleId: vehiculId }),
    ).rejects.toThrow();

    expect(await prisma.dossier.count({ where: { userId } })).toBe(before);
    expect(await prisma.signedForm.count({ where: { userId } })).toBe(signedBefore);
  });
});
