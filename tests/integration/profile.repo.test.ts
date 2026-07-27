import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { getProfile, upsertProfile } from "@/lib/profile/repository";
import { resetEnvCache } from "@/lib/config/env";

// CNP/IBAN sintetice, valide (cifre de control corecte).
const CNP = "1960101223143";
const IBAN = "RO49AAAA1B31007593840000";

describe("profile repository (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 3).toString("base64");
    }
    resetEnvCache();
    const suffix = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const user = await prisma.user.create({
      data: { id: `it_${suffix}`, name: "IT", email: `it_${suffix}@example.com` },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("stochează CNP/IBAN CRIPTAT — valoarea din DB nu e în clar", async () => {
    await upsertProfile(userId, {
      nume: "Ionescu",
      prenume: "Ana",
      cnp: CNP,
      iban: IBAN,
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });

    // Citim rândul BRUT din DB (fără decriptare) și dovedim că nu e în clar.
    const raw = await prisma.profile.findUnique({ where: { userId } });
    expect(raw?.cnpEnc).toBeTruthy();
    expect(raw?.cnpEnc).not.toContain(CNP);
    expect(raw?.ibanEnc).not.toContain(IBAN);
    expect(raw?.cnpEnc?.startsWith("v1:")).toBe(true);

    // Round-trip prin repository: se decriptează corect.
    const p = await getProfile(userId);
    expect(p?.cnp).toBe(CNP);
    expect(p?.iban).toBe(IBAN);
    expect(p?.nume).toBe("Ionescu");
    expect(p?.addresses[0]?.localitate).toBe("Cluj-Napoca");
  });

  it("update parțial: înlocuiește adresele, dar păstrează CNP (câmp absent)", async () => {
    await upsertProfile(userId, {
      addresses: [{ tip: "RESEDINTA", localitate: "București" }],
    });
    const p = await getProfile(userId);
    expect(p?.addresses).toHaveLength(1);
    expect(p?.addresses[0]?.tip).toBe("RESEDINTA");
    // CNP absent din payload → neschimbat (semantică parțială)
    expect(p?.cnp).toBe(CNP);
  });

  it("șterge un câmp tare cu șir gol", async () => {
    await upsertProfile(userId, { iban: "" });
    const p = await getProfile(userId);
    expect(p?.iban).toBeNull();
    expect(p?.cnp).toBe(CNP); // restul neatins
  });

  it("respinge CNP invalid (validare la graniță)", async () => {
    await expect(upsertProfile(userId, { cnp: "1111111111111" })).rejects.toThrow();
  });

  it("respinge IBAN invalid", async () => {
    await expect(
      upsertProfile(userId, { iban: "RO49AAAA1B31007593840001" }),
    ).rejects.toThrow();
  });

  it("pune DOMICILIU primul, deterministic (chiar dacă e adăugat al doilea)", async () => {
    await upsertProfile(userId, {
      addresses: [
        { tip: "RESEDINTA", localitate: "București" },
        { tip: "DOMICILIU", localitate: "Cluj-Napoca" },
      ],
    });
    const p = await getProfile(userId);
    // addresses[0] = domiciliul (folosit de formularul 230 ca adresă fiscală)
    expect(p?.addresses[0]?.tip).toBe("DOMICILIU");
    expect(p?.addresses[0]?.localitate).toBe("Cluj-Napoca");
  });

  it("null pe o dată nu o corupe la epoch (rămâne neschimbată)", async () => {
    await upsertProfile(userId, { dataNasterii: "1990-05-05" });
    const before = (await getProfile(userId))?.dataNasterii;
    expect(before?.toISOString().slice(0, 10)).toBe("1990-05-05");
    // null explicit (din JSON) → tratat ca absent, nu 1970-01-01
    await upsertProfile(userId, { dataNasterii: null } as unknown as { dataNasterii?: Date });
    const after = (await getProfile(userId))?.dataNasterii;
    expect(after?.toISOString().slice(0, 10)).toBe("1990-05-05");
  });
});
