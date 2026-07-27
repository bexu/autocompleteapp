import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { createVehicul } from "@/lib/vehicle/repository";
import { FormValidationError, generateForm } from "@/lib/forms/engine";

describe("formulare auto (integration, DB reală)", () => {
  let userId: string;
  let vehiculId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 7).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `auto_${s}`, name: "A", email: `auto_${s}@ex.com` } });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu",
      prenume: "Ana",
      cnp: "1960101223143",
      addresses: [{ tip: "DOMICILIU", localitate: "Cluj-Napoca", judet: "Cluj" }],
    });
    const v = await createVehicul(userId, {
      vin: "WBA3A5C50FF123456",
      marca: "BMW",
      model: "320d",
      nrInmatriculare: "CJ 12 ABC",
      normaPoluare: "Euro 6",
      emisiiCo2GKm: "120",
      putereKw: "140",
    });
    vehiculId = v.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("generează ITL-005 Cluj din profil + vehicul", async () => {
    const { pdf, fields, manifest } = await generateForm(userId, {
      formCode: "ITL-005",
      jurisdiction: "cluj",
      at: new Date("2026-06-01"),
      vehicleId: vehiculId,
    });
    expect(manifest.id).toBe("ITL-005-cluj-2026");
    expect(Buffer.from(pdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    const byKey = Object.fromEntries(fields.map((f) => [f.key, f.value]));
    expect(byKey.vin).toBe("WBA3A5C50FF123456");
    expect(byKey.normaPoluare).toBe("Euro 6");
    expect(byKey.cnp).toBe("1960101223143");
  });

  it("respinge generarea dacă lipsește vehiculul (VIN obligatoriu)", async () => {
    await expect(
      generateForm(userId, {
        formCode: "ITL-005",
        jurisdiction: "cluj",
        at: new Date("2026-06-01"),
      }),
    ).rejects.toBeInstanceOf(FormValidationError);
  });

  it("generează ITL-054 (contract) cu datele cumpărătorului", async () => {
    const { pdf } = await generateForm(userId, {
      formCode: "ITL-054",
      vehicleId: vehiculId,
      inputs: {
        cumparatorNume: "Popescu Dan",
        cumparatorCnp: "5000101123457",
        pret: "15000",
        dataContract: "2026-03-01",
      },
    });
    expect(Buffer.from(pdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
  });
});
