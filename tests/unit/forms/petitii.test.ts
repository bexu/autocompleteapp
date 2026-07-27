import { beforeEach, describe, expect, it } from "vitest";
import { _clearRegistry, selectManifest } from "@/lib/forms/manifest";
import { mapForm } from "@/lib/forms/mapping";
import { PETITIE_MANIFEST, PetitieBodySchema, registerPetitii } from "@/lib/forms/petitii";
import type { DecryptedProfile } from "@/lib/profile/repository";

const profile: DecryptedProfile = {
  nume: "Ionescu", prenume: "Ana", sex: "F", dataNasterii: null,
  cnp: "1960101223143", ciSerie: null, ciNr: null, ciEmitent: null, ciExp: null,
  telefon: "0740000000", iban: null,
  addresses: [{ tip: "DOMICILIU", strada: "X", nr: "1", localitate: "Cluj-Napoca", uat: "Cluj", judet: "Cluj", codPostal: "400000" }],
};

const inputs = {
  institutie: "ANPC — Autoritatea pentru Protecția Consumatorilor",
  subiect: "Produs defect",
  continut: "Am cumpărat un produs care nu funcționează.",
  solicitare: "Solicit înlocuirea produsului.",
};

describe("petiție universală", () => {
  beforeEach(() => {
    _clearRegistry();
    registerPetitii();
  });

  it("selectează PETITIE la nivel național", () => {
    expect(selectManifest("PETITIE", "national", new Date("2026-07-01"))?.id).toBe("PETITIE-national-2024");
  });

  it("mapează petentul din profil + textul din inputuri", () => {
    const r = mapForm(PETITIE_MANIFEST, { profile }, inputs);
    expect(r.errors).toHaveLength(0);
    const byKey = Object.fromEntries(r.fields.map((f) => [f.key, f.value]));
    expect(byKey.nume).toBe("Ionescu");
    expect(byKey.institutie).toContain("ANPC");
    expect(byKey.solicitare).toBe("Solicit înlocuirea produsului.");
  });

  it("cere subiect + conținut + solicitare", () => {
    const r = mapForm(PETITIE_MANIFEST, { profile }, { institutie: "Primărie" });
    expect(r.errors.some((e) => e.key === "subiect")).toBe(true);
    expect(r.errors.some((e) => e.key === "continut")).toBe(true);
    expect(r.errors.some((e) => e.key === "solicitare")).toBe(true);
  });

  it("schema respinge conținut gol", () => {
    const parsed = PetitieBodySchema.safeParse({ ...inputs, continut: "" });
    expect(parsed.success).toBe(false);
  });
});
