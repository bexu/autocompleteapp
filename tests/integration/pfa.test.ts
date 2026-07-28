import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { generatePfaCase } from "@/lib/pfa/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("ciclul PFA (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 15).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `pfa_${s}`, name: "P", email: `pfa_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Popescu", prenume: "Ion", cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const infiintare = {
    event: "INFIINTARE" as const,
    tipEntitate: "PFA" as const, denumirePropusa: "Popescu Ion PFA", judetSediu: "Cluj",
    sediuLocalitate: "Cluj-Napoca", sediuStrada: "Memorandumului", sediuNumar: "10",
    dovadaSpatiuTip: "Proprietate" as const, codCaenPrincipal: "6201", descriereCaenPrincipal: "Programare",
    dataInceput: "2026-09-01",
  };

  it("ÎNFIINȚARE generează REZERVARE-PFA + INREGISTRARE-PFA, fiecare cu dosar", async () => {
    const result = await generatePfaCase(userId, infiintare);
    expect(result.forms.map((f) => f.formCode)).toEqual(["REZERVARE-PFA", "INREGISTRARE-PFA"]);
    for (const f of result.forms) {
      const d = await getDossier(userId, f.dossierId);
      expect(d?.status).toBe("DE_DEPUS");
    }
  });

  it("MENȚIUNE generează doar MENTIUNI-PFA", async () => {
    const result = await generatePfaCase(userId, {
      event: "MENTIUNE",
      denumirePfa: "Popescu Ion PFA", nrOrdineRegistru: "F40/1234/2020", cui: "12345678", orctJudet: "Cluj",
      tipMentiune: "Suspendare activitate", modEliberare: "Ghișeu", dataSuspendarePanaLa: "2027-09-01",
    });
    expect(result.forms.map((f) => f.formCode)).toEqual(["MENTIUNI-PFA"]);
  });

  it("atomicitate: CAEN invalid (nu 4 cifre) — dar Zod prinde asta; motorul prinde câmp lipsă", async () => {
    const before = await prisma.dossier.count({ where: { userId } });
    await expect(
      generatePfaCase(userId, { ...infiintare, codCaenPrincipal: "", descriereCaenPrincipal: "" }),
    ).rejects.toThrow();
    expect(await prisma.dossier.count({ where: { userId } })).toBe(before);
  });
});
