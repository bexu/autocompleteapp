import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import {
  createImobil,
  deleteImobil,
  getImobil,
  listImobile,
  updateImobil,
} from "@/lib/imobil/repository";

describe("imobil repository (integration, DB reală)", () => {
  let userId: string;
  let otherId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 1).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `imo_${s}`, name: "I", email: `imo_${s}@ex.com` } });
    const o = await prisma.user.create({ data: { id: `oth_${s}`, name: "O", email: `otho_${s}@ex.com` } });
    userId = u.id;
    otherId = o.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherId] } } });
    await prisma.$disconnect();
  });

  it("creează un imobil cu adresă + cadastral", async () => {
    const im = await createImobil(userId, {
      tip: "APARTAMENT",
      judet: "Cluj",
      localitate: "Cluj-Napoca",
      strada: "Memorandumului",
      nr: "10",
      suprafataMp: "65",
      nrCadastral: "12345",
    });
    expect(im.tip).toBe("APARTAMENT");
    expect(im.localitate).toBe("Cluj-Napoca");
    expect(im.suprafataMp).toBe(65);
  });

  it("respinge tip invalid", async () => {
    await expect(createImobil(userId, { tip: "CASTEL" })).rejects.toThrow();
  });

  it("update + delete cu verificare de proprietate", async () => {
    const im = await createImobil(userId, { tip: "CASA", localitate: "Florești" });
    const upd = await updateImobil(userId, im.id, { tip: "CASA", localitate: "Baciu" });
    expect(upd?.localitate).toBe("Baciu");

    expect(await getImobil(otherId, im.id)).toBeNull();
    expect(await updateImobil(otherId, im.id, { tip: "CASA" })).toBeNull();
    expect(await deleteImobil(otherId, im.id)).toBe(false);

    expect((await listImobile(userId)).some((x) => x.id === im.id)).toBe(true);
    expect(await deleteImobil(userId, im.id)).toBe(true);
    expect(await getImobil(userId, im.id)).toBeNull();
  });
});
