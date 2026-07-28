import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import {
  INREGISTRARE_ANOFM_MANIFEST,
  SOMAJ_MANIFEST,
  SomajBodySchema,
  registerSomaj,
} from "@/lib/forms/somaj";
import type { DecryptedProfile } from "@/lib/profile/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu", prenume: "Andrei", sex: "M", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: "0740000000", iban: "RO49AAAA1B31007593840000",
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const inputs = {
  ultimaFormaInvatamant: "Studii superioare",
  actAbsolvire: "Diplomă seria X nr. 123, 2015, UBB",
  stareCivila: "Necăsătorit",
  cetatenie: "Română",
  capacitateMunca: "Aptă, fără restricții",
  ultimulAngajator: "ACME SRL",
  dataIncetare: "2026-07-01",
  motivIncetare: "Concediere colectivă (art. 65)",
  adeverintaMedicala: "Nr. 55 / 2026-07-05",
  optiunePlata: "Virament bancar",
};

describe("dosar șomaj (înregistrare ANOFM + indemnizație)", () => {
  beforeEach(() => {
    _clearRegistry();
    registerSomaj();
  });

  it("selectează INREGISTRARE-ANOFM și SOMAJ la nivel național", () => {
    expect(selectManifest("INREGISTRARE-ANOFM", "national", new Date("2026-07-27"))?.id).toBe("INREGISTRARE-ANOFM-national-2024");
    expect(selectManifest("SOMAJ", "national", new Date("2026-07-27"))?.id).toBe("SOMAJ-national-2024");
  });

  it("SOMAJ mapează solicitantul din profil + datele încetării", () => {
    const r = mapForm(SOMAJ_MANIFEST, { profile }, inputs);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.ultimulAngajator).toBe("ACME SRL");
    expect(byKey.optiunePlata).toBe("Virament bancar");
  });

  it("SOMAJ cere angajator + dată încetare + adeverință + opțiune de plată", () => {
    const bad = mapForm(SOMAJ_MANIFEST, { profile }, {});
    for (const k of ["ultimulAngajator", "dataIncetare", "motivIncetare", "adeverintaMedicala", "optiunePlata"]) {
      expect(bad.errors.some((e) => e.key === k)).toBe(true);
    }
  });

  it("respinge o dată de încetare invalidă (validare de format)", () => {
    const r = mapForm(SOMAJ_MANIFEST, { profile }, { ...inputs, dataIncetare: "2026-02-30" });
    expect(r.errors.some((e) => e.key === "dataIncetare")).toBe(true);
  });

  it("INREGISTRARE cere studii + stare civilă + cetățenie + capacitate de muncă", () => {
    const bad = mapForm(INREGISTRARE_ANOFM_MANIFEST, { profile }, {});
    for (const k of ["ultimaFormaInvatamant", "actAbsolvire", "stareCivila", "cetatenie", "capacitateMunca"]) {
      expect(bad.errors.some((e) => e.key === k)).toBe(true);
    }
    // ultimul loc de muncă e opțional pe fișa de înregistrare
    expect(bad.errors.some((e) => e.key === "ultimulAngajator")).toBe(false);
  });

  it("Zod: enum pe opțiunea de plată + dată invalidă respinsă", () => {
    expect(SomajBodySchema.safeParse({ ...inputs, optiunePlata: "cripto" }).success).toBe(false);
    expect(SomajBodySchema.safeParse({ ...inputs, dataIncetare: "32.01.2026" }).success).toBe(false);
    expect(SomajBodySchema.safeParse(inputs).success).toBe(true);
  });
});
