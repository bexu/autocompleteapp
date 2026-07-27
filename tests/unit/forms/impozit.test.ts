import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import { ITL_001_CLUJ, ITL_003_CLUJ, registerImpozit } from "@/lib/forms/impozit";
import type { DecryptedProfile } from "@/lib/profile/repository";
import type { Imobil } from "@/lib/imobil/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu", prenume: "Ana", sex: "F", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: null, iban: null,
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const cladire: Imobil = {
  id: "im1", tip: "APARTAMENT", judet: "Cluj", localitate: "Cluj-Napoca",
  strada: "Memorandumului", nr: "10", bloc: null, scara: null, etaj: null,
  apartament: null, codPostal: null, suprafataMp: 65, nrCadastral: "12345", nrCarteFunciara: "CF999",
};

describe("impozit imobil (ITL-001/003)", () => {
  beforeEach(() => {
    _clearRegistry();
    registerImpozit();
  });

  it("selectează ITL-001 și ITL-003 pentru jurisdicția Cluj", () => {
    expect(selectManifest("ITL-001", "cluj", new Date("2026-01-01"))?.id).toBe("ITL-001-cluj-2024");
    expect(selectManifest("ITL-003", "cluj", new Date("2026-01-01"))?.id).toBe("ITL-003-cluj-2024");
  });

  it("ITL-001 (clădire) mapează proprietar + imobil + valoare", () => {
    const r = mapForm(ITL_001_CLUJ, { profile, imobil: cladire }, {
      dataDobandire: "2026-03-01",
      cotaParte: "1/1",
      valoareImpozabila: "250000",
    });
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.imobilLocalitate).toBe("Cluj-Napoca");
    expect(byKey.imobilCadastral).toBe("12345");
    expect(byKey.valoareImpozabila).toBe("250000");
  });

  it("ITL-003 (teren) cere categoria de folosință", () => {
    const teren = { ...cladire, tip: "TEREN" };
    const bad = mapForm(ITL_003_CLUJ, { profile, imobil: teren }, { dataDobandire: "2026-03-01" });
    expect(bad.errors.some((e) => e.key === "categoriaFolosinta")).toBe(true);

    const ok = mapForm(ITL_003_CLUJ, { profile, imobil: teren }, { dataDobandire: "2026-03-01", categoriaFolosinta: "curți-construcții" });
    expect(ok.errors).toHaveLength(0);
  });

  it("semnalează data dobândirii lipsă", () => {
    const r = mapForm(ITL_001_CLUJ, { profile, imobil: cladire }, {});
    expect(r.errors.some((e) => e.key === "dataDobandire")).toBe(true);
  });
});
