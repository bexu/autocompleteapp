import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import {
  CERERE_INSCRIERE_CF_MANIFEST,
  EXTRAS_CF_MANIFEST,
  CadastruBodySchema,
  registerCadastru,
} from "@/lib/forms/cadastru";
import type { DecryptedProfile } from "@/lib/profile/repository";
import type { Imobil } from "@/lib/imobil/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu", prenume: "Ana", sex: "F", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: "0740000000", iban: null,
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const imobil: Imobil = {
  id: "im1", tip: "APARTAMENT", judet: "Cluj", localitate: "Cluj-Napoca",
  strada: "Memorandumului", nr: "10", bloc: null, scara: null, etaj: null,
  apartament: null, codPostal: null, suprafataMp: 65, nrCadastral: "12345", nrCarteFunciara: "CF999",
};

const inputs = {
  felInscriere: "Intabulare",
  descriereDrept: "drept de proprietate",
  actTip: "act notarial",
  actNumar: "1234",
  actData: "2026-05-10",
  actEmitent: "BNP Exemplu",
  modComunicare: "E-mail",
  scopExtras: "Extras de carte funciară pentru informare",
};

describe("dosar cadastru / CF", () => {
  beforeEach(() => {
    _clearRegistry();
    registerCadastru();
  });

  it("selectează CERERE-INSCRIERE-CF și EXTRAS-CF la nivel național", () => {
    expect(selectManifest("CERERE-INSCRIERE-CF", "national", new Date("2026-07-01"))?.id).toBe("CERERE-INSCRIERE-CF-national-2023");
    expect(selectManifest("EXTRAS-CF", "national", new Date("2026-07-01"))?.id).toBe("EXTRAS-CF-national-2023");
  });

  it("mapează solicitantul + imobilul + operațiunea", () => {
    const r = mapForm(CERERE_INSCRIERE_CF_MANIFEST, { profile, imobil }, inputs);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.imobilCf).toBe("CF999");
    expect(byKey.felInscriere).toBe("Intabulare");
  });

  it("cere operațiune + descriere + act complet", () => {
    const bad = mapForm(CERERE_INSCRIERE_CF_MANIFEST, { profile, imobil }, {});
    for (const k of ["felInscriere", "descriereDrept", "actTip", "actNumar", "actData", "actEmitent", "modComunicare"]) {
      expect(bad.errors.some((e) => e.key === k)).toBe(true);
    }
  });

  it("respinge o dată a actului invalidă", () => {
    const r = mapForm(CERERE_INSCRIERE_CF_MANIFEST, { profile, imobil }, { ...inputs, actData: "2026-02-30" });
    expect(r.errors.some((e) => e.key === "actData")).toBe(true);
  });

  it("EXTRAS-CF cere scopul extrasului", () => {
    const bad = mapForm(EXTRAS_CF_MANIFEST, { profile, imobil }, {});
    expect(bad.errors.some((e) => e.key === "scopExtras")).toBe(true);
  });

  it("Zod: enum pe felul înscrierii + imobilId obligatoriu", () => {
    expect(CadastruBodySchema.safeParse({ imobilId: "im1", ...inputs }).success).toBe(true);
    expect(CadastruBodySchema.safeParse({ imobilId: "im1", ...inputs, felInscriere: "stergere" }).success).toBe(false);
    expect(CadastruBodySchema.safeParse({ ...inputs }).success).toBe(false); // fără imobilId
  });
});
