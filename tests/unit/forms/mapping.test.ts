import { describe, expect, it } from "vitest";
import { mapForm } from "@/lib/forms/mapping";
import { F230_MANIFEST } from "@/lib/forms/f230";
import type { DecryptedProfile } from "@/lib/profile/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu",
  prenume: "Ana",
  sex: "F",
  dataNasterii: null,
  cnp: "1960101223143",
  ciSerie: "TR",
  ciNr: "123456",
  ciEmitent: null,
  ciExp: null,
  telefon: null,
  iban: null,
  addresses: [
    {
      tip: "DOMICILIU",
      strada: "Memorandumului",
      nr: "10",
      localitate: "Cluj-Napoca",
      uat: "Cluj-Napoca",
      judet: "Cluj",
      codPostal: "400000",
    },
  ],
};

const goodInputs = {
  beneficiarDenumire: "Asociația X",
  beneficiarCif: "12345678",
  beneficiarIban: "RO49AAAA1B31007593840000",
  doiAni: true,
};

describe("mapForm (230)", () => {
  it("mapează profilul + inputurile fără erori", () => {
    const r = mapForm(F230_MANIFEST, { profile }, goodInputs);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.nume).toBe("Ionescu");
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.judet).toBe("Cluj");
    expect(byKey.localitate).toBe("Cluj-Napoca");
    expect(byKey.beneficiarDenumire).toBe("Asociația X");
    expect(byKey.beneficiarIban).toBe("RO49AAAA1B31007593840000");
    expect(byKey.doiAni).toBe("Da"); // boolean → text
  });

  it("semnalează câmp obligatoriu lipsă (profil incomplet)", () => {
    const r = mapForm(F230_MANIFEST, { profile: { ...profile, cnp: null } }, goodInputs);
    expect(r.errors.some((e) => e.key === "cnp")).toBe(true);
  });

  it("semnalează IBAN beneficiar invalid", () => {
    const r = mapForm(F230_MANIFEST, { profile }, {
      ...goodInputs,
      beneficiarIban: "RO00INVALID",
    });
    expect(r.errors.some((e) => e.key === "beneficiarIban")).toBe(true);
  });
});
