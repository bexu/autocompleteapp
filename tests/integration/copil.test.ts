import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { generateCopilCase } from "@/lib/copil/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("dosar copil (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 3).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `cp_${s}`, name: "P", email: `cp_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Popescu",
      prenume: "Andrei",
      cnp: "1960101223143",
      iban: "RO49AAAA1B31007593840000",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const validInput = {
    copilNume: "Popescu",
    copilPrenume: "Maria",
    copilCnp: "5000101123457",
    copilDataNasterii: "2026-06-01",
    angajator: "ACME SRL",
    cui: "RO12345",
    perioadaConcediu: "01.07.2026 – 01.07.2028",
  };

  it("generează ALOCATIE + INDEMNIZATIE, fiecare cu dosar 'de depus'", async () => {
    const result = await generateCopilCase(userId, validInput);
    expect(result.forms.map((f) => f.formCode)).toEqual(["ALOCATIE", "INDEMNIZATIE"]);
    for (const f of result.forms) {
      const d = await getDossier(userId, f.dossierId);
      expect(d?.status).toBe("DE_DEPUS");
      expect(d?.formCode).toBe(f.formCode);
    }
  });

  it("atomicitate: input invalid (fără angajator) NU lasă dosare orfane", async () => {
    const before = await prisma.dossier.count({ where: { userId } });
    const signedBefore = await prisma.signedForm.count({ where: { userId } });
    await expect(
      generateCopilCase(userId, { ...validInput, angajator: "", perioadaConcediu: "" }),
    ).rejects.toThrow();
    expect(await prisma.dossier.count({ where: { userId } })).toBe(before);
    expect(await prisma.signedForm.count({ where: { userId } })).toBe(signedBefore);
  });
});
