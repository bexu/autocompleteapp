import { z } from "zod";
import type { FormManifest } from "./manifest";
import { registerManifest } from "./manifest";

// Validare la granița C168 (input extern → Zod). imobilId identifică proprietatea;
// restul sunt inputurile formularului.
export const C168BodySchema = z.object({
  imobilId: z.string().min(1, "imobil lipsă"),
  tipOperatiune: z.string().max(30).optional(),
  chiriasNume: z.string().max(200).optional(),
  chiriasCnp: z.string().max(20).optional(),
  chirie: z.string().max(30).optional(),
  moneda: z.string().max(10).optional(),
  perioadaStart: z.string().max(30).optional(),
  perioadaEnd: z.string().max(30).optional(),
  dataContract: z.string().max(30).optional(),
});

// C168 — Declarație privind înregistrarea/modificarea/încetarea contractului de
// locațiune (OPANAF 161/2025). Locatorul = utilizatorul (din profil); imobilul
// din entitatea Imobil; chiriaș/chirie/perioadă ca inputuri. Sursa oficială +
// hash se completează la obținere; până atunci workflow = "generated".

export const C168_MANIFEST: FormManifest = {
  id: "C168-national-2025",
  authority: "ANAF",
  jurisdiction: "national",
  formCode: "C168",
  revision: "2025",
  validFrom: "2025-01-01",
  sourceUrl: null,
  sourceSha256: null,
  workflow: "generated",
  signature: "none", // depus prin SPV cu credențialele proprii
  title: "C168 — Declarație contract de locațiune",
  fields: [
    { key: "tipOperatiune", label: "Operațiune", source: { from: "input", key: "tipOperatiune" }, required: true },
    // Locator (utilizatorul).
    { key: "locatorNume", label: "Locator — nume", source: { from: "profile", path: "nume" }, required: true },
    { key: "locatorPrenume", label: "Locator — prenume", source: { from: "profile", path: "prenume" }, required: true },
    { key: "locatorCnp", label: "Locator — CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
    // Imobil.
    { key: "imobilTip", label: "Tip imobil", source: { from: "imobil", path: "tip" }, required: true },
    { key: "imobilLocalitate", label: "Localitate imobil", source: { from: "imobil", path: "localitate" }, required: true },
    { key: "imobilStrada", label: "Stradă imobil", source: { from: "imobil", path: "strada" } },
    { key: "imobilNr", label: "Număr imobil", source: { from: "imobil", path: "nr" } },
    { key: "imobilSuprafata", label: "Suprafață (mp)", source: { from: "imobil", path: "suprafataMp" } },
    { key: "imobilCadastral", label: "Nr. cadastral", source: { from: "imobil", path: "nrCadastral" } },
    // Contract (inputuri).
    { key: "chiriasNume", label: "Chiriaș — nume", source: { from: "input", key: "chiriasNume" }, required: true },
    { key: "chiriasCnp", label: "Chiriaș — CNP/CIF", source: { from: "input", key: "chiriasCnp" }, required: true },
    { key: "chirie", label: "Chirie", source: { from: "input", key: "chirie" }, required: true },
    { key: "moneda", label: "Monedă", source: { from: "input", key: "moneda" }, required: true },
    { key: "perioadaStart", label: "De la data", source: { from: "input", key: "perioadaStart" }, required: true },
    { key: "perioadaEnd", label: "Până la data", source: { from: "input", key: "perioadaEnd" } },
    { key: "dataContract", label: "Data contractului", source: { from: "input", key: "dataContract" }, required: true },
  ],
  inputs: [
    { key: "tipOperatiune", label: "Operațiune (înregistrare/modificare/încetare)", required: true },
    { key: "chiriasNume", label: "Nume complet chiriaș", required: true },
    { key: "chiriasCnp", label: "CNP/CIF chiriaș", required: true },
    { key: "chirie", label: "Chirie", required: true },
    { key: "moneda", label: "Monedă (RON/EUR)", required: true },
    { key: "perioadaStart", label: "De la data", required: true },
    { key: "perioadaEnd", label: "Până la data" },
    { key: "dataContract", label: "Data contractului", required: true },
  ],
  channels: [
    {
      id: "spv",
      label: "Spațiul Privat Virtual (SPV) — ANAF",
      url: null,
      instructions:
        "Depune C168 în SPV, în 30 de zile de la încheierea/modificarea/încetarea contractului, cu contractul atașat.",
    },
  ],
};

export function registerC168(): void {
  registerManifest(C168_MANIFEST);
}
