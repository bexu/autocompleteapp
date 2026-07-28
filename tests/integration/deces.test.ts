import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { generateDecesCase } from "@/lib/deces/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("dosar deces (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 13).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `dec_${s}`, name: "D", email: `dec_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu", prenume: "Ana", cnp: "1960101223143",
      iban: "RO49AAAA1B31007593840000",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const validInput = {
    decedatNume: "Ionescu Ion",
    decedatCnp: "2980312051007",
    dataDeces: "2026-06-01",
    decedatCalitate: "pensionar" as const,
    certificatDecesNumar: "X-123",
    certificatDecesData: "2026-06-03",
    certificatDecesEmitent: "Primăria Cluj-Napoca",
    calitateSolicitant: "soț/soție" as const,
    modalitatePlata: "cont bancar (IBAN)" as const,
    casaPensiiAjutor: "Casa Județeană de Pensii Cluj",
    calitateUrmas: "soț supraviețuitor" as const,
    titulariUrmasi: "Ionescu Ana",
    casaPensiiUrmas: "Casa Județeană de Pensii Cluj",
  };

  it("generează AJUTOR-DECES + PENSIE-URMAS, fiecare cu dosar 'de depus'", async () => {
    const result = await generateDecesCase(userId, validInput);
    expect(result.forms.map((f) => f.formCode)).toEqual(["AJUTOR-DECES", "PENSIE-URMAS"]);
    for (const f of result.forms) {
      const d = await getDossier(userId, f.dossierId);
      expect(d?.status).toBe("DE_DEPUS");
      expect(d?.formCode).toBe(f.formCode);
    }
  });

  it("atomicitate: CNP decedat invalid NU lasă dosare orfane", async () => {
    const before = await prisma.dossier.count({ where: { userId } });
    const signedBefore = await prisma.signedForm.count({ where: { userId } });
    await expect(
      generateDecesCase(userId, { ...validInput, decedatCnp: "1234567890123" }),
    ).rejects.toThrow();
    expect(await prisma.dossier.count({ where: { userId } })).toBe(before);
    expect(await prisma.signedForm.count({ where: { userId } })).toBe(signedBefore);
  });

  it("plata în cont fără IBAN în profil e respinsă (fără dosare orfane)", async () => {
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `dec2_${s}`, name: "D2", email: `dec2_${s}@ex.com` } });
    await upsertProfile(u.id, {
      nume: "Fără", prenume: "Iban", cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
    // modalitatePlata = cont bancar (IBAN) dar profilul NU are IBAN → respins.
    await expect(generateDecesCase(u.id, validInput)).rejects.toThrow();
    expect(await prisma.dossier.count({ where: { userId: u.id } })).toBe(0);
    // Cu mandat poștal, același profil trece.
    const ok = await generateDecesCase(u.id, { ...validInput, modalitatePlata: "mandat poștal la domiciliu" });
    expect(ok.forms).toHaveLength(2);
    await prisma.user.delete({ where: { id: u.id } }).catch(() => {});
  });
});
