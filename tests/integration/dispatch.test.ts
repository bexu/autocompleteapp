import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { signForm } from "@/lib/forms/engine";
import { getDossier, listDossiers, markSubmitted } from "@/lib/dispatch/repository";

describe("dispatch / dosare (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 9).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({
      data: { id: `disp_${s}`, name: "D", email: `disp_${s}@example.com` },
    });
    userId = u.id;
    await upsertProfile(userId, { nume: "Ionescu", prenume: "Ana", cnp: "1960101223143" });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  const benef = {
    beneficiarDenumire: "Asociația X",
    beneficiarCif: "12345678",
    beneficiarIban: "RO49AAAA1B31007593840000",
  };

  it("semnarea deschide un dosar 'de depus' legat de documentul semnat", async () => {
    const { dossierId, signedFormId } = await signForm(userId, {
      formCode: "230",
      inputs: benef,
    });
    const dossier = await getDossier(userId, dossierId);
    expect(dossier?.status).toBe("DE_DEPUS");
    expect(dossier?.formCode).toBe("230");
    expect(dossier?.signedFormId).toBe(signedFormId);
    expect(dossier?.deadline).toBe("25 mai");
  });

  it("userul marchează dosarul ca depus", async () => {
    const { dossierId } = await signForm(userId, { formCode: "230", inputs: benef });
    const now = new Date("2026-05-10T09:00:00.000Z");
    const updated = await markSubmitted(userId, dossierId, now);
    expect(updated?.status).toBe("DEPUS");
    expect(updated?.submittedAt).toEqual(now);
  });

  it("nu poate marca dosarul altui user", async () => {
    const { dossierId } = await signForm(userId, { formCode: "230", inputs: benef });
    expect(await markSubmitted("alt-user", dossierId)).toBeNull();
    expect(await getDossier("alt-user", dossierId)).toBeNull();
  });

  it("dosarele apar în listă", async () => {
    const list = await listDossiers(userId);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.every((d) => d.formCode === "230")).toBe(true);
  });
});
