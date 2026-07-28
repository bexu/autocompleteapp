import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import {
  AJUTOR_DECES_MANIFEST,
  PENSIE_URMAS_MANIFEST,
  DecesBodySchema,
  registerDeces,
} from "@/lib/forms/deces";
import type { DecryptedProfile } from "@/lib/profile/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu", prenume: "Ana", sex: "F", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: "0740000000", iban: "RO49AAAA1B31007593840000",
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const inputs = {
  decedatNume: "Ionescu Ion",
  decedatCnp: "2980312051007",
  dataDeces: "2026-06-01",
  decedatCalitate: "pensionar",
  certificatDecesNumar: "X-123",
  certificatDecesData: "2026-06-03",
  certificatDecesEmitent: "Primăria Cluj-Napoca",
  calitateSolicitant: "soț/soție",
  modalitatePlata: "cont bancar (IBAN)",
  casaPensiiAjutor: "Casa Județeană de Pensii Cluj",
  calitateUrmas: "soț supraviețuitor",
  titulariUrmasi: "Ionescu Ana — soț supraviețuitor",
  casaPensiiUrmas: "Casa Județeană de Pensii Cluj",
};

describe("dosar deces în familie (ajutor de deces + pensie de urmaș)", () => {
  beforeEach(() => {
    _clearRegistry();
    registerDeces();
  });

  it("selectează AJUTOR-DECES și PENSIE-URMAS la nivel național", () => {
    expect(selectManifest("AJUTOR-DECES", "national", new Date("2026-07-01"))?.id).toBe("AJUTOR-DECES-national-2024");
    expect(selectManifest("PENSIE-URMAS", "national", new Date("2026-07-01"))?.id).toBe("PENSIE-URMAS-national-2024");
  });

  it("AJUTOR-DECES mapează solicitantul (profil) + decedatul (inputuri)", () => {
    const r = mapForm(AJUTOR_DECES_MANIFEST, { profile }, inputs);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.decedatCnp).toBe("2980312051007");
    expect(byKey.calitateSolicitant).toBe("soț/soție");
  });

  it("respinge CNP-ul decedatului invalid și data decesului invalidă", () => {
    const badCnp = mapForm(AJUTOR_DECES_MANIFEST, { profile }, { ...inputs, decedatCnp: "1234567890123" });
    expect(badCnp.errors.some((e) => e.key === "decedatCnp")).toBe(true);
    const badDate = mapForm(AJUTOR_DECES_MANIFEST, { profile }, { ...inputs, dataDeces: "2026-02-30" });
    expect(badDate.errors.some((e) => e.key === "dataDeces")).toBe(true);
  });

  it("PENSIE-URMAS cere calitatea de urmaș + titularii", () => {
    const bad = mapForm(PENSIE_URMAS_MANIFEST, { profile }, { ...inputs, calitateUrmas: "", titulariUrmasi: "" });
    expect(bad.errors.some((e) => e.key === "calitateUrmas")).toBe(true);
    expect(bad.errors.some((e) => e.key === "titulariUrmasi")).toBe(true);
  });

  it("Zod: enum-uri validate; cauza decesului opțională (\"\" acceptat)", () => {
    expect(DecesBodySchema.safeParse(inputs).success).toBe(true);
    expect(DecesBodySchema.safeParse({ ...inputs, cauzaDeces: "" }).success).toBe(true);
    expect(DecesBodySchema.safeParse({ ...inputs, calitateSolicitant: "vecin" }).success).toBe(false);
  });
});
