import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { generatePetitie } from "@/lib/petitii/service";
import { getDossier } from "@/lib/dispatch/repository";

describe("petiție universală (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 3).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `pt_${s}`, name: "A", email: `pt_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu",
      prenume: "Ana",
      cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("generează o petiție + dosar 'de depus' către instituția aleasă", async () => {
    const result = await generatePetitie(userId, {
      institutie: "ANPC — Autoritatea pentru Protecția Consumatorilor",
      subiect: "Produs defect",
      continut: "Am cumpărat un produs care nu funcționează conform specificațiilor.",
      solicitare: "Solicit înlocuirea produsului sau restituirea contravalorii.",
    });
    expect(result.formCode).toBe("PETITIE");
    expect(result.institutie).toContain("ANPC");
    const d = await getDossier(userId, result.dossierId);
    expect(d?.status).toBe("DE_DEPUS");
    expect(d?.formCode).toBe("PETITIE");
  });
});
