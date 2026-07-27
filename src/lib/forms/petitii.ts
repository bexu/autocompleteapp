import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";

// Petiție universală (OG 27/2002 — dreptul de petiționare). Un singur builder
// care generează o cerere/sesizare către o instituție, cu petentul din profil
// și subiectul/conținutul/solicitarea ca inputuri. Instituția o alege userul.

export const INSTITUTII: { id: string; label: string }[] = [
  { id: "anpc", label: "ANPC — Autoritatea pentru Protecția Consumatorilor" },
  { id: "anspdcp", label: "ANSPDCP — Protecția Datelor (GDPR)" },
  { id: "itm", label: "ITM — Inspecția Muncii" },
  { id: "avp", label: "Avocatul Poporului" },
  { id: "primarie", label: "Primărie / Consiliu Local" },
  { id: "alta", label: "Altă instituție publică" },
];

const petent: FieldDef[] = [
  { key: "nume", label: "Petent — nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Petent — prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "Petent — CNP", source: { from: "profile", path: "cnp" }, validate: "cnp" },
  { key: "telefon", label: "Telefon", source: { from: "profile", path: "telefon" } },
  { key: "domiciliuLocalitate", label: "Localitate", source: { from: "profile", path: "addresses.0.localitate" } },
];

export const PETITIE_MANIFEST: FormManifest = {
  id: "PETITIE-national-2024",
  authority: "Instituție publică",
  jurisdiction: "national",
  formCode: "PETITIE",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: null,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Petiție / sesizare către o instituție publică",
  fields: [
    ...petent,
    { key: "institutie", label: "Instituția destinatară", source: { from: "input", key: "institutie" }, required: true },
    { key: "subiect", label: "Subiect", source: { from: "input", key: "subiect" }, required: true },
    { key: "continut", label: "Conținutul petiției", source: { from: "input", key: "continut" }, required: true },
    { key: "solicitare", label: "Ce solicit concret", source: { from: "input", key: "solicitare" }, required: true },
  ],
  inputs: [
    { key: "institutie", label: "Instituția destinatară", required: true },
    { key: "subiect", label: "Subiect", required: true },
    { key: "continut", label: "Descrie situația (fapte, date, context)", required: true },
    { key: "solicitare", label: "Ce soliciți concret de la instituție", required: true },
  ],
  channels: [
    { id: "registratura", label: "Registratura instituției (fizic / e-mail / poștal)", url: null, instructions: "Trimite petiția la registratura instituției; ai dreptul la răspuns în 30 de zile (OG 27/2002)." },
  ],
};

// Validare la granița builder-ului de petiții.
export const PetitieBodySchema = z.object({
  institutie: z.string().min(1, "instituție lipsă").max(200),
  subiect: z.string().min(1, "subiect lipsă").max(200),
  continut: z.string().min(1, "conținut lipsă").max(5000),
  solicitare: z.string().min(1, "solicitare lipsă").max(2000),
});

export function registerPetitii(): void {
  registerManifest(PETITIE_MANIFEST);
}
