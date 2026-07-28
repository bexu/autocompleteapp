import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import {
  CERTIFICAT_URBANISM_MANIFEST,
  AUTORIZATIE_CONSTRUIRE_MANIFEST,
  UrbanismBodySchema,
  registerUrbanism,
} from "@/lib/forms/urbanism";
import type { DecryptedProfile } from "@/lib/profile/repository";
import type { Imobil } from "@/lib/imobil/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu", prenume: "Ana", sex: "F", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: "0740000000", iban: null,
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const imobil: Imobil = {
  id: "im1", tip: "TEREN", judet: "Cluj", localitate: "Cluj-Napoca",
  strada: "Memorandumului", nr: "10", bloc: null, scara: null, etaj: null,
  apartament: null, codPostal: null, suprafataMp: 500, nrCadastral: "12345", nrCarteFunciara: "CF999",
};

const cert = { scopSolicitare: "Construire", tipObiectImobil: "Teren", descriereScop: "Casă de locuit P+1" };
const aut = {
  tipLucrare: "Construire", descriereLucrare: "Casă P+1", valoareLucrari: "150000",
  certificatUrbanismNumar: "CU-123", certificatUrbanismData: "2026-05-10", proiectant: "Arh. X, OAR Cluj",
};

describe("urbanism / construcții (Legea 50/1991)", () => {
  beforeEach(() => {
    _clearRegistry();
    registerUrbanism();
  });

  it("selectează CERTIFICAT-URBANISM și AUTORIZATIE-CONSTRUIRE la nivel național", () => {
    const at = new Date("2026-07-01");
    expect(selectManifest("CERTIFICAT-URBANISM", "national", at)?.id).toBe("CERTIFICAT-URBANISM-national-2009");
    expect(selectManifest("AUTORIZATIE-CONSTRUIRE", "national", at)?.id).toBe("AUTORIZATIE-CONSTRUIRE-national-2009");
  });

  it("CERTIFICAT mapează solicitantul + imobilul + scopul", () => {
    const r = mapForm(CERTIFICAT_URBANISM_MANIFEST, { profile, imobil }, cert);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.imobilCf).toBe("CF999");
    expect(byKey.scopSolicitare).toBe("Construire");
  });

  it("AUTORIZATIE cere tip + valoare + certificat + proiectant", () => {
    const bad = mapForm(AUTORIZATIE_CONSTRUIRE_MANIFEST, { profile, imobil }, {});
    for (const k of ["tipLucrare", "descriereLucrare", "valoareLucrari", "certificatUrbanismNumar", "certificatUrbanismData", "proiectant"]) {
      expect(bad.errors.some((e) => e.key === k)).toBe(true);
    }
    const ok = mapForm(AUTORIZATIE_CONSTRUIRE_MANIFEST, { profile, imobil }, aut);
    expect(ok.errors).toHaveLength(0);
  });

  it("respinge data certificatului invalidă", () => {
    const r = mapForm(AUTORIZATIE_CONSTRUIRE_MANIFEST, { profile, imobil }, { ...aut, certificatUrbanismData: "2026-02-30" });
    expect(r.errors.some((e) => e.key === "certificatUrbanismData")).toBe(true);
  });

  it("Zod: enum-uri, valoare numerică, durată numerică, imobilId obligatoriu", () => {
    expect(UrbanismBodySchema.safeParse({ event: "CERTIFICAT", imobilId: "im1", ...cert }).success).toBe(true);
    expect(UrbanismBodySchema.safeParse({ event: "AUTORIZATIE", imobilId: "im1", ...aut }).success).toBe(true);
    expect(UrbanismBodySchema.safeParse({ event: "AUTORIZATIE", imobilId: "im1", ...aut, valoareLucrari: "mult" }).success).toBe(false);
    expect(UrbanismBodySchema.safeParse({ event: "CERTIFICAT", imobilId: "im1", ...cert, scopSolicitare: "altceva" }).success).toBe(false);
    expect(UrbanismBodySchema.safeParse({ event: "CERTIFICAT", ...cert }).success).toBe(false); // fără imobilId
  });
});
