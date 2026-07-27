import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import { ITL_005_CLUJ_2026, ITL_054_NATIONAL, registerAuto } from "@/lib/forms/auto";
import type { DecryptedProfile } from "@/lib/profile/repository";
import type { Vehicul } from "@/lib/vehicle/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu",
  prenume: "Ana",
  sex: "F",
  dataNasterii: null,
  cnp: "1960101223143",
  ciSerie: null,
  ciNr: null,
  ciEmitent: null,
  ciExp: null,
  telefon: null,
  iban: null,
  addresses: [
    { tip: "DOMICILIU", strada: "Memorandumului", nr: "10", localitate: "Cluj-Napoca", uat: "Cluj-Napoca", judet: "Cluj", codPostal: "400000" },
  ],
};

const vehicul: Vehicul = {
  id: "v1",
  vin: "WBA3A5C50FF123456",
  marca: "BMW",
  model: "320d",
  nrInmatriculare: "CJ 12 ABC",
  civSerie: null,
  serieMotor: "M47D20",
  cilindreeCm3: 1995,
  masaMaximaKg: 1980,
  anFabricatie: 2019,
  combustibil: "HIBRID",
  normaPoluare: "Euro 6",
  emisiiCo2GKm: 120,
  putereKw: 140,
  dataDobandire: new Date("2026-03-01T00:00:00Z"),
};

describe("manifeste auto", () => {
  beforeEach(() => {
    _clearRegistry();
    registerAuto();
  });

  it("selectează ITL-005 Cluj rev. 2026 la o dată din 2026", () => {
    const m = selectManifest("ITL-005", "cluj", new Date("2026-06-01"));
    expect(m?.id).toBe("ITL-005-cluj-2026");
    expect(m?.jurisdiction).toBe("cluj");
  });

  it("mapează ITL-005 din profil + vehicul, cu câmpurile fiscale 2026", () => {
    const r = mapForm(ITL_005_CLUJ_2026, { profile, vehicle: vehicul }, {});
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.nume).toBe("Ionescu");
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.vin).toBe("WBA3A5C50FF123456");
    expect(byKey.normaPoluare).toBe("Euro 6");
    expect(byKey.emisiiCo2GKm).toBe("120");
    expect(byKey.putereKw).toBe("140");
    expect(byKey.localitate).toBe("Cluj-Napoca");
  });

  it("ITL-054 cere date de cumpărător (input) + validează CNP-ul acestuia", () => {
    const ok = mapForm(ITL_054_NATIONAL, { profile, vehicle: vehicul }, {
      cumparatorNume: "Popescu Dan",
      cumparatorCnp: "5000101123457",
      pret: "15000",
      dataContract: "2026-03-01",
    });
    expect(ok.errors).toHaveLength(0);

    const bad = mapForm(ITL_054_NATIONAL, { profile, vehicle: vehicul }, {
      cumparatorNume: "Popescu Dan",
      cumparatorCnp: "1111111111111",
      pret: "15000",
      dataContract: "2026-03-01",
    });
    expect(bad.errors.some((e) => e.key === "cumparatorCnp")).toBe(true);
  });

  it("semnalează VIN lipsă (vehicul incomplet)", () => {
    const r = mapForm(ITL_005_CLUJ_2026, { profile, vehicle: { ...vehicul, vin: null } }, {});
    expect(r.errors.some((e) => e.key === "vin")).toBe(true);
  });
});
