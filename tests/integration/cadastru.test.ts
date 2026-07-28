import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { createImobil } from "@/lib/imobil/repository";
import { generateCadastruCase } from "@/lib/cadastru/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("dosar cadastru/CF (integration, DB reală)", () => {
  let userId: string;
  let imobilId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 11).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `cad_${s}`, name: "C", email: `cad_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu", prenume: "Ana", cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
    const im = await createImobil(userId, { tip: "APARTAMENT", judet: "Cluj", localitate: "Cluj-Napoca", nrCarteFunciara: "CF999", nrCadastral: "12345" });
    imobilId = im.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const validInput = {
    imobilId: "",
    felInscriere: "Intabulare" as const,
    descriereDrept: "drept de proprietate",
    actTip: "act notarial",
    actNumar: "1234",
    actData: "2026-05-10",
    actEmitent: "BNP Exemplu",
    modComunicare: "E-mail" as const,
    scopExtras: "Extras de carte funciară pentru informare" as const,
  };

  it("generează EXTRAS-CF + CERERE-INSCRIERE-CF, fiecare cu dosar 'de depus'", async () => {
    const result = await generateCadastruCase(userId, { ...validInput, imobilId });
    expect(result.forms.map((f) => f.formCode)).toEqual(["EXTRAS-CF", "CERERE-INSCRIERE-CF"]);
    for (const f of result.forms) {
      const d = await getDossier(userId, f.dossierId);
      expect(d?.status).toBe("DE_DEPUS");
      expect(d?.formCode).toBe(f.formCode);
    }
  });

  it("atomicitate: dată de act invalidă NU lasă dosare orfane", async () => {
    const before = await prisma.dossier.count({ where: { userId } });
    const signedBefore = await prisma.signedForm.count({ where: { userId } });
    await expect(
      generateCadastruCase(userId, { ...validInput, imobilId, actData: "2026-02-30" }),
    ).rejects.toThrow();
    expect(await prisma.dossier.count({ where: { userId } })).toBe(before);
    expect(await prisma.signedForm.count({ where: { userId } })).toBe(signedBefore);
  });
});
