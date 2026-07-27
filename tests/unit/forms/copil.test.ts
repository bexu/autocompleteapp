import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import { ALOCATIE_MANIFEST, INDEMNIZATIE_MANIFEST, registerCopil } from "@/lib/forms/copil";
import type { DecryptedProfile } from "@/lib/profile/repository";

const profile: DecryptedProfile = {
  nume: "Popescu", prenume: "Andrei", sex: "M", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: null, iban: "RO49AAAA1B31007593840000",
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const copilInputs = {
  copilNume: "Popescu",
  copilPrenume: "Maria",
  copilCnp: "5000101123457",
  copilDataNasterii: "2026-06-01",
  angajator: "ACME SRL",
  cui: "RO12345",
  perioadaConcediu: "01.07.2026 – 01.07.2028",
};

describe("dosar copil (alocație + indemnizație)", () => {
  beforeEach(() => {
    _clearRegistry();
    registerCopil();
  });

  it("selectează ALOCATIE și INDEMNIZATIE la nivel național", () => {
    expect(selectManifest("ALOCATIE", "national", new Date("2026-07-01"))?.id).toBe("ALOCATIE-national-2024");
    expect(selectManifest("INDEMNIZATIE", "cluj", new Date("2026-07-01"))?.id).toBe("INDEMNIZATIE-national-2024");
  });

  it("ALOCATIE mapează solicitantul din profil + copilul din inputuri", () => {
    const r = mapForm(ALOCATIE_MANIFEST, { profile }, copilInputs);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.cnp).toBe("1960101223143");
    expect(byKey.copilPrenume).toBe("Maria");
    expect(byKey.copilCnp).toBe("5000101123457");
  });

  it("INDEMNIZATIE cere angajator + perioada concediului", () => {
    const bad = mapForm(INDEMNIZATIE_MANIFEST, { profile }, {
      copilNume: "Popescu", copilPrenume: "Maria", copilCnp: "5000101123457", copilDataNasterii: "2026-06-01",
    });
    expect(bad.errors.some((e) => e.key === "angajator")).toBe(true);
    expect(bad.errors.some((e) => e.key === "perioadaConcediu")).toBe(true);

    const ok = mapForm(INDEMNIZATIE_MANIFEST, { profile }, copilInputs);
    expect(ok.errors).toHaveLength(0);
  });

  it("respinge un CNP de copil invalid", () => {
    const r = mapForm(ALOCATIE_MANIFEST, { profile }, { ...copilInputs, copilCnp: "1234567890123" });
    expect(r.errors.some((e) => e.key === "copilCnp")).toBe(true);
  });
});
