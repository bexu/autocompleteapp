import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { generateAndFileForms } from "@/lib/forms/engine";

// Garanția de atomicitate a motorului: generarea unui SET de formulare validează
// tot înainte de a scrie, apoi persistă într-o singură tranzacție → totul sau
// nimic (niciun signedForm/dosar orfan dacă un formular din set eșuează).
describe("generateAndFileForms — atomicitate (integration)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 21).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `atx_${s}`, name: "A", email: `atx_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Popescu", prenume: "Andrei", cnp: "1960101223143",
      iban: "RO49AAAA1B31007593840000",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const copilInputs = {
    copilNume: "Popescu", copilPrenume: "Maria", copilCnp: "5000101123457", copilDataNasterii: "2026-06-01",
    angajator: "ACME SRL", perioadaConcediu: "01.07.2026 – 01.07.2028",
  };

  it("un set valid creează exact N signedForms + N dosare", async () => {
    const filed = await generateAndFileForms(userId, [
      { formCode: "ALOCATIE", inputs: copilInputs },
      { formCode: "INDEMNIZATIE", inputs: copilInputs },
    ]);
    expect(filed).toHaveLength(2);
    expect(await prisma.dossier.count({ where: { userId } })).toBe(2);
    expect(await prisma.signedForm.count({ where: { userId } })).toBe(2);
  });

  it("dacă un formular din set e invalid, NIMIC nu se persistă (nici cel valid dinainte)", async () => {
    const dBefore = await prisma.dossier.count({ where: { userId } });
    const sBefore = await prisma.signedForm.count({ where: { userId } });

    // Al doilea formular (INDEMNIZATIE) fără angajator/perioadă → invalid.
    await expect(
      generateAndFileForms(userId, [
        { formCode: "ALOCATIE", inputs: copilInputs },
        { formCode: "INDEMNIZATIE", inputs: { copilNume: "P", copilPrenume: "M", copilCnp: "5000101123457", copilDataNasterii: "2026-06-01" } },
      ]),
    ).rejects.toThrow();

    // Nici ALOCATIE (primul, valid) nu a fost scris.
    expect(await prisma.dossier.count({ where: { userId } })).toBe(dBefore);
    expect(await prisma.signedForm.count({ where: { userId } })).toBe(sBefore);
  });
});
