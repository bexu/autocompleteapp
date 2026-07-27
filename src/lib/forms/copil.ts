import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";

// Dosar „nou-născut" (DASM): alocație de stat + indemnizație creștere copil.
// Solicitantul din profil; datele copilului și angajatorul ca inputuri (nu
// persistăm o entitate copil separată în v1). Sursa oficială la obținere.

const solicitant: FieldDef[] = [
  { key: "nume", label: "Solicitant — nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Solicitant — prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "Solicitant — CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "iban", label: "IBAN pentru plată", source: { from: "profile", path: "iban" }, validate: "iban" },
];

const copil: FieldDef[] = [
  { key: "copilNume", label: "Copil — nume", source: { from: "input", key: "copilNume" }, required: true },
  { key: "copilPrenume", label: "Copil — prenume", source: { from: "input", key: "copilPrenume" }, required: true },
  { key: "copilCnp", label: "Copil — CNP", source: { from: "input", key: "copilCnp" }, required: true, validate: "cnp" },
  { key: "copilDataNasterii", label: "Copil — data nașterii", source: { from: "input", key: "copilDataNasterii" }, required: true },
];

export const ALOCATIE_MANIFEST: FormManifest = {
  id: "ALOCATIE-national-2024",
  authority: "DGASPC / Primărie",
  jurisdiction: "national",
  formCode: "ALOCATIE",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: null,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere alocație de stat pentru copil",
  fields: [...solicitant, ...copil],
  inputs: [
    { key: "copilNume", label: "Nume copil", required: true },
    { key: "copilPrenume", label: "Prenume copil", required: true },
    { key: "copilCnp", label: "CNP copil", required: true, validate: "cnp" },
    { key: "copilDataNasterii", label: "Data nașterii copil", required: true },
  ],
  channels: [
    { id: "dasm", label: "DASM / Primărie", url: null, instructions: "Depune cererea de alocație cu certificatul de naștere și actele de identitate." },
  ],
};

export const INDEMNIZATIE_MANIFEST: FormManifest = {
  id: "INDEMNIZATIE-national-2024",
  authority: "AJPIS",
  jurisdiction: "national",
  formCode: "INDEMNIZATIE",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: null,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere indemnizație creștere copil",
  fields: [
    ...solicitant,
    ...copil,
    { key: "angajator", label: "Angajator", source: { from: "input", key: "angajator" }, required: true },
    { key: "cui", label: "CUI angajator", source: { from: "input", key: "cui" } },
    { key: "perioadaConcediu", label: "Perioada concediului", source: { from: "input", key: "perioadaConcediu" }, required: true },
  ],
  inputs: [
    { key: "copilNume", label: "Nume copil", required: true },
    { key: "copilPrenume", label: "Prenume copil", required: true },
    { key: "copilCnp", label: "CNP copil", required: true, validate: "cnp" },
    { key: "copilDataNasterii", label: "Data nașterii copil", required: true },
    { key: "angajator", label: "Angajator", required: true },
    { key: "cui", label: "CUI angajator" },
    { key: "perioadaConcediu", label: "Perioada concediului (de la – până la)", required: true },
  ],
  channels: [
    { id: "ajpis", label: "AJPIS (Agenția Județeană pentru Plăți și Inspecție Socială)", url: null, instructions: "Depune dosarul de indemnizație cu adeverința de venit de la angajator și actele copilului." },
  ],
};

export const COPIL_BODY_SCHEMA = z.object({
  copilNume: z.string().max(120).optional(),
  copilPrenume: z.string().max(120).optional(),
  copilCnp: z.string().max(20).optional(),
  copilDataNasterii: z.string().max(30).optional(),
  angajator: z.string().max(200).optional(),
  cui: z.string().max(30).optional(),
  perioadaConcediu: z.string().max(60).optional(),
});

export function registerCopil(): void {
  registerManifest(ALOCATIE_MANIFEST);
  registerManifest(INDEMNIZATIE_MANIFEST);
}
