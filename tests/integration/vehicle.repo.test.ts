import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import {
  createVehicul,
  deleteVehicul,
  getVehicul,
  listVehicule,
  updateVehicul,
} from "@/lib/vehicle/repository";

describe("vehicle repository (integration, DB reală)", () => {
  let userId: string;
  let otherId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 1).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({ data: { id: `veh_${s}`, name: "V", email: `veh_${s}@ex.com` } });
    const o = await prisma.user.create({ data: { id: `oth_${s}`, name: "O", email: `oth_${s}@ex.com` } });
    userId = u.id;
    otherId = o.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherId] } } });
    await prisma.$disconnect();
  });

  it("creează un vehicul cu câmpurile ITL-005 (normă/CO2/putere)", async () => {
    const v = await createVehicul(userId, {
      vin: "wba3a5c50ff123456",
      marca: "BMW",
      model: "320d",
      nrInmatriculare: "CJ 12 ABC",
      combustibil: "HIBRID",
      normaPoluare: "Euro 6",
      emisiiCo2GKm: "120",
      putereKw: "140",
      cilindreeCm3: "1995",
    });
    expect(v.vin).toBe("WBA3A5C50FF123456"); // normalizat majuscule
    expect(v.marca).toBe("BMW");
    expect(v.normaPoluare).toBe("Euro 6");
    expect(v.emisiiCo2GKm).toBe(120);
    expect(v.putereKw).toBe(140);
  });

  it("respinge VIN invalid", async () => {
    await expect(createVehicul(userId, { vin: "PREA-SCURT" })).rejects.toThrow();
  });

  it("update + list + delete cu verificare de proprietate", async () => {
    const v = await createVehicul(userId, { marca: "Dacia", model: "Logan" });
    const upd = await updateVehicul(userId, v.id, { marca: "Dacia", model: "Sandero" });
    expect(upd?.model).toBe("Sandero");

    // alt user nu poate accesa/modifica/șterge
    expect(await getVehicul(otherId, v.id)).toBeNull();
    expect(await updateVehicul(otherId, v.id, { marca: "X" })).toBeNull();
    expect(await deleteVehicul(otherId, v.id)).toBe(false);

    expect((await listVehicule(userId)).some((x) => x.id === v.id)).toBe(true);
    expect(await deleteVehicul(userId, v.id)).toBe(true);
    expect(await getVehicul(userId, v.id)).toBeNull();
  });
});
