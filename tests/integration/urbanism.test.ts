import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { createImobil } from "@/lib/imobil/repository";
import { generateUrbanismCase } from "@/lib/urbanism/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("urbanism (integration, DB reală)", () => {
  let userId: string;
  let imobilId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 17).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `urb_${s}`, name: "U", email: `urb_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu", prenume: "Ana", cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
    const im = await createImobil(userId, { tip: "TEREN", judet: "Cluj", localitate: "Cluj-Napoca", nrCadastral: "12345" });
    imobilId = im.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("CERTIFICAT generează CERTIFICAT-URBANISM cu dosar 'de depus'", async () => {
    const r = await generateUrbanismCase(userId, {
      event: "CERTIFICAT", imobilId,
      scopSolicitare: "Construire", tipObiectImobil: "Teren", descriereScop: "Casă P+1",
    });
    expect(r.forms.map((f) => f.formCode)).toEqual(["CERTIFICAT-URBANISM"]);
    const d = await getDossier(userId, r.forms[0].dossierId);
    expect(d?.status).toBe("DE_DEPUS");
  });

  it("AUTORIZATIE generează AUTORIZATIE-CONSTRUIRE", async () => {
    const r = await generateUrbanismCase(userId, {
      event: "AUTORIZATIE", imobilId,
      tipLucrare: "Construire", descriereLucrare: "Casă P+1", valoareLucrari: "150000",
      certificatUrbanismNumar: "CU-123", certificatUrbanismData: "2026-05-10", proiectant: "Arh. X",
    });
    expect(r.forms.map((f) => f.formCode)).toEqual(["AUTORIZATIE-CONSTRUIRE"]);
  });

  it("atomicitate: dată certificat invalidă NU lasă dosare orfane", async () => {
    const before = await prisma.dossier.count({ where: { userId } });
    await expect(
      generateUrbanismCase(userId, {
        event: "AUTORIZATIE", imobilId,
        tipLucrare: "Construire", descriereLucrare: "Casă", valoareLucrari: "150000",
        certificatUrbanismNumar: "CU-123", certificatUrbanismData: "2026-02-30", proiectant: "Arh. X",
      }),
    ).rejects.toThrow();
    expect(await prisma.dossier.count({ where: { userId } })).toBe(before);
  });
});
