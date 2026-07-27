import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { FormValidationError, generateForm } from "@/lib/forms/engine";

describe("form engine 230 (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 6).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({
      data: { id: `f_${s}`, name: "F", email: `f_${s}@example.com` },
    });
    userId = u.id;
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

  it("respinge generarea când profilul e incomplet", async () => {
    await expect(
      generateForm(userId, { formCode: "230", inputs: benef }),
    ).rejects.toBeInstanceOf(FormValidationError);
  });

  it("generează PDF valid din profil + entitate beneficiară", async () => {
    await upsertProfile(userId, {
      nume: "Ionescu",
      prenume: "Ana",
      cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });

    const { pdf, fields, manifest } = await generateForm(userId, {
      formCode: "230",
      inputs: benef,
    });

    expect(manifest.formCode).toBe("230");
    expect(Buffer.from(pdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f.value]));
    expect(byKey.nume).toBe("Ionescu");
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.beneficiarDenumire).toBe("Asociația X");
  });
});
