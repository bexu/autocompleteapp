import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import { C168_MANIFEST, registerC168 } from "@/lib/forms/c168";
import type { DecryptedProfile } from "@/lib/profile/repository";
import type { Imobil } from "@/lib/imobil/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu", prenume: "Ana", sex: "F", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: null, iban: null, addresses: [],
};

const imobil: Imobil = {
  id: "im1", tip: "APARTAMENT", judet: "Cluj", localitate: "Cluj-Napoca",
  strada: "Memorandumului", nr: "10", bloc: null, scara: null, etaj: null,
  apartament: null, codPostal: null, suprafataMp: 65, nrCadastral: "12345",
  nrCarteFunciara: null,
};

const inputs = {
  tipOperatiune: "Înregistrare",
  chiriasNume: "Popescu Dan",
  chiriasCnp: "5000101123457",
  chirie: "1500",
  moneda: "RON",
  perioadaStart: "2026-08-01",
  dataContract: "2026-07-27",
};

describe("C168", () => {
  beforeEach(() => {
    _clearRegistry();
    registerC168();
  });

  it("selectează C168 la o dată din 2025+", () => {
    expect(selectManifest("C168", "national", new Date("2026-01-01"))?.id).toBe("C168-national-2025");
  });

  it("mapează locator (profil) + imobil + contract (input)", () => {
    const r = mapForm(C168_MANIFEST, { profile, imobil }, inputs);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.locatorNume).toBe("Ionescu");
    expect(byKey.locatorCnp).toBe("1960101223143");
    expect(byKey.imobilLocalitate).toBe("Cluj-Napoca");
    expect(byKey.imobilCadastral).toBe("12345");
    expect(byKey.chiriasNume).toBe("Popescu Dan");
    expect(byKey.chirie).toBe("1500");
    expect(byKey.tipOperatiune).toBe("Înregistrare");
  });

  it("semnalează chiriaș lipsă și localitate imobil lipsă", () => {
    const r1 = mapForm(C168_MANIFEST, { profile, imobil }, { ...inputs, chiriasNume: "" });
    expect(r1.errors.some((e) => e.key === "chiriasNume")).toBe(true);

    const r2 = mapForm(C168_MANIFEST, { profile, imobil: { ...imobil, localitate: null } }, inputs);
    expect(r2.errors.some((e) => e.key === "imobilLocalitate")).toBe(true);
  });
});
