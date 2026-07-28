import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import {
  REZERVARE_PFA_MANIFEST,
  INREGISTRARE_PFA_MANIFEST,
  MENTIUNI_PFA_MANIFEST,
  PfaBodySchema,
  registerPfa,
} from "@/lib/forms/pfa";
import type { DecryptedProfile } from "@/lib/profile/repository";

const profile: DecryptedProfile = {
  nume: "Popescu", prenume: "Ion", sex: "M", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: "0740000000", iban: null,
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const infiintare = {
  event: "INFIINTARE" as const,
  tipEntitate: "PFA", denumirePropusa: "Popescu Ion PFA", judetSediu: "Cluj",
  sediuLocalitate: "Cluj-Napoca", sediuStrada: "Memorandumului", sediuNumar: "10",
  dovadaSpatiuTip: "Proprietate", codCaenPrincipal: "6201", descriereCaenPrincipal: "Programare",
  dataInceput: "2026-09-01",
};

const mentiune = {
  event: "MENTIUNE" as const,
  denumirePfa: "Popescu Ion PFA", nrOrdineRegistru: "F40/1234/2020", cui: "12345678", orctJudet: "Cluj",
  tipMentiune: "Suspendare activitate", modEliberare: "Ghișeu", dataSuspendarePanaLa: "2027-09-01",
};

describe("ciclul de viață PFA (ONRC)", () => {
  beforeEach(() => {
    _clearRegistry();
    registerPfa();
  });

  it("selectează cele 3 formulare PFA la nivel național", () => {
    const at = new Date("2026-07-01");
    expect(selectManifest("REZERVARE-PFA", "national", at)?.id).toBe("REZERVARE-PFA-national-2024");
    expect(selectManifest("INREGISTRARE-PFA", "national", at)?.id).toBe("INREGISTRARE-PFA-national-2024");
    expect(selectManifest("MENTIUNI-PFA", "national", at)?.id).toBe("MENTIUNI-PFA-national-2024");
  });

  it("REZERVARE + INREGISTRARE mapează titularul (profil) + inputurile", () => {
    const r1 = mapForm(REZERVARE_PFA_MANIFEST, { profile }, infiintare);
    expect(r1.errors).toHaveLength(0);
    const r2 = mapForm(INREGISTRARE_PFA_MANIFEST, { profile }, infiintare);
    expect(r2.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r2.fields.map((f) => [f.key, f.value]));
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.codCaenPrincipal).toBe("6201");
  });

  it("INREGISTRARE cere sediu + CAEN + dată început", () => {
    const bad = mapForm(INREGISTRARE_PFA_MANIFEST, { profile }, { event: "INFIINTARE" });
    for (const k of ["sediuJudet", "sediuLocalitate", "sediuStrada", "sediuNumar", "dovadaSpatiuTip", "codCaenPrincipal", "descriereCaenPrincipal", "dataInceput"]) {
      expect(bad.errors.some((e) => e.key === k)).toBe(true);
    }
  });

  it("MENTIUNI cere identificarea PFA + tipul mențiunii", () => {
    const bad = mapForm(MENTIUNI_PFA_MANIFEST, { profile }, { event: "MENTIUNE" });
    for (const k of ["denumirePfa", "nrOrdineRegistru", "cui", "orctJudet", "tipMentiune", "modEliberare"]) {
      expect(bad.errors.some((e) => e.key === k)).toBe(true);
    }
  });

  it("Zod: CAEN 4 cifre, enum-uri, dată reală", () => {
    expect(PfaBodySchema.safeParse(infiintare).success).toBe(true);
    expect(PfaBodySchema.safeParse(mentiune).success).toBe(true);
    expect(PfaBodySchema.safeParse({ ...infiintare, codCaenPrincipal: "62" }).success).toBe(false);
    expect(PfaBodySchema.safeParse({ ...infiintare, tipEntitate: "SRL" }).success).toBe(false);
    expect(PfaBodySchema.safeParse({ ...infiintare, dataInceput: "2026-02-30" }).success).toBe(false);
    expect(PfaBodySchema.safeParse({ ...mentiune, tipMentiune: "altceva" }).success).toBe(false);
  });

  it("Zod: mențiunea cere câmpul specific operației alese", () => {
    // Radiere fără motiv → respins; cu motiv → acceptat.
    const radiereFaraMotiv = { event: "MENTIUNE" as const, denumirePfa: "X PFA", nrOrdineRegistru: "F40/1/2020", cui: "123", orctJudet: "Cluj", tipMentiune: "Radiere", modEliberare: "Ghișeu" };
    const bad = PfaBodySchema.safeParse(radiereFaraMotiv);
    expect(bad.success).toBe(false);
    if (!bad.success) expect(bad.error.issues.some((i) => i.path.join(".") === "motivRadiere")).toBe(true);
    expect(PfaBodySchema.safeParse({ ...radiereFaraMotiv, motivRadiere: "Renunțare" }).success).toBe(true);

    // Schimbare sediu fără noul sediu → respins.
    const schimbFaraSediu = { event: "MENTIUNE" as const, denumirePfa: "X PFA", nrOrdineRegistru: "F40/1/2020", cui: "123", orctJudet: "Cluj", tipMentiune: "Schimbare sediu profesional", modEliberare: "Ghișeu" };
    expect(PfaBodySchema.safeParse(schimbFaraSediu).success).toBe(false);
    expect(PfaBodySchema.safeParse({ ...schimbFaraSediu, noulSediu: "Cluj, str. Nouă 5" }).success).toBe(true);
  });
});
