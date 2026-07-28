import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { generateSomajCase } from "@/lib/somaj/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("dosar șomaj (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 9).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `so_${s}`, name: "S", email: `so_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu",
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
    ultimaFormaInvatamant: "Studii superioare",
    actAbsolvire: "Diplomă X 123, 2015, UBB",
    stareCivila: "Necăsătorit",
    cetatenie: "Română",
    capacitateMunca: "Aptă",
    ultimulAngajator: "ACME SRL",
    dataIncetare: "2026-07-01",
    motivIncetare: "Concediere (art. 65)",
    adeverintaMedicala: "Nr. 55 / 2026-07-05",
    optiunePlata: "Virament bancar" as const,
  };

  it("generează INREGISTRARE-ANOFM + SOMAJ, fiecare cu dosar 'de depus'", async () => {
    const result = await generateSomajCase(userId, validInput);
    expect(result.forms.map((f) => f.formCode)).toEqual(["INREGISTRARE-ANOFM", "SOMAJ"]);
    for (const f of result.forms) {
      const d = await getDossier(userId, f.dossierId);
      expect(d?.status).toBe("DE_DEPUS");
      expect(d?.formCode).toBe(f.formCode);
    }
  });

  it("atomicitate: dată de încetare invalidă NU lasă dosare orfane", async () => {
    const before = await prisma.dossier.count({ where: { userId } });
    const signedBefore = await prisma.signedForm.count({ where: { userId } });
    await expect(
      generateSomajCase(userId, { ...validInput, dataIncetare: "2026-02-30" }),
    ).rejects.toThrow();
    expect(await prisma.dossier.count({ where: { userId } })).toBe(before);
    expect(await prisma.signedForm.count({ where: { userId } })).toBe(signedBefore);
  });
});
