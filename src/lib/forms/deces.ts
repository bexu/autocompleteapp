import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";
import { optionalDateString, optionalEnum } from "@/lib/validation/zod";

// Dosar „deces în familie" (CNPP, Legea 360/2023). Solicitantul = membrul de
// familie supraviețuitor (din profil). Datele decedatului + certificatul de
// deces + calitatea sunt inputuri — NU persistăm datele decedatului (minimizare).
// Două formulare reale: ajutorul de deces (Anexa 11) + pensia de urmaș (Anexa 7).
// Unealtă, nu consultant: nu evaluăm eligibilitatea și nu calculăm cuantumuri.

export const DECEDAT_CALITATE = [
  "asigurat",
  "pensionar",
  "persoană asigurată în ultimele 6 luni",
  "membru de familie neasigurat",
] as const;

export const CALITATE_SOLICITANT_DECES = [
  "soț/soție",
  "copil",
  "părinte",
  "altă persoană care a suportat cheltuielile",
] as const;

export const MODALITATE_PLATA_DECES = [
  "mandat poștal la domiciliu",
  "cont bancar (IBAN)",
] as const;

export const CALITATE_URMAS = ["soț supraviețuitor", "copil"] as const;

export const CAUZA_DECES = [
  "deces obișnuit",
  "accident de muncă",
  "boală profesională",
] as const;

const solicitant: FieldDef[] = [
  { key: "nume", label: "Solicitant — nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Solicitant — prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "Solicitant — CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "telefon", label: "Telefon", source: { from: "profile", path: "telefon" } },
  { key: "domiciliuJudet", label: "Domiciliu — județ", source: { from: "profile", path: "addresses.0.judet" } },
  { key: "domiciliuLocalitate", label: "Domiciliu — localitate", source: { from: "profile", path: "addresses.0.localitate" } },
];

// Datele decedatului + certificatul — comune ambelor formulare (inputuri).
const decedat: FieldDef[] = [
  { key: "decedatNume", label: "Decedat — nume și prenume", source: { from: "input", key: "decedatNume" }, required: true },
  { key: "decedatCnp", label: "Decedat — CNP", source: { from: "input", key: "decedatCnp" }, required: true, validate: "cnp" },
  { key: "dataDeces", label: "Data decesului", source: { from: "input", key: "dataDeces" }, required: true, validate: "date" },
  { key: "decedatCalitate", label: "Calitatea decedatului", source: { from: "input", key: "decedatCalitate" }, required: true },
  { key: "decedatDosarPensie", label: "Nr. dosar de pensie al decedatului (dacă era pensionar)", source: { from: "input", key: "decedatDosarPensie" } },
  { key: "certificatDecesNumar", label: "Certificat de deces — serie/număr", source: { from: "input", key: "certificatDecesNumar" }, required: true },
  { key: "certificatDecesData", label: "Certificat de deces — data eliberării", source: { from: "input", key: "certificatDecesData" }, required: true, validate: "date" },
];

export const AJUTOR_DECES_MANIFEST: FormManifest = {
  id: "AJUTOR-DECES-national-2024",
  authority: "Casa Teritorială/Județeană de Pensii (CNPP)",
  jurisdiction: "national",
  formCode: "AJUTOR-DECES",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: "https://www.cnpp.ro/en/ajutorul-de-deces",
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere pentru acordarea ajutorului de deces (Anexa 11)",
  fields: [
    ...solicitant,
    { key: "iban", label: "IBAN (dacă plata se face în cont)", source: { from: "profile", path: "iban" }, validate: "iban" },
    ...decedat,
    { key: "certificatDecesEmitent", label: "Certificat de deces — emitent (primăria)", source: { from: "input", key: "certificatDecesEmitent" }, required: true },
    { key: "calitateSolicitant", label: "Calitatea solicitantului față de decedat", source: { from: "input", key: "calitateSolicitant" }, required: true },
    { key: "modalitatePlata", label: "Modalitatea de plată", source: { from: "input", key: "modalitatePlata" }, required: true },
    { key: "casaPensiiAjutor", label: "Casa de pensii competentă (domiciliul decedatului)", source: { from: "input", key: "casaPensiiAjutor" }, required: true },
  ],
  inputs: [
    { key: "decedatNume", label: "Decedat — nume și prenume", required: true },
    { key: "decedatCnp", label: "Decedat — CNP", required: true, validate: "cnp" },
    { key: "dataDeces", label: "Data decesului", required: true, validate: "date" },
    { key: "decedatCalitate", label: "Calitatea decedatului la data decesului", required: true },
    { key: "decedatDosarPensie", label: "Nr. dosar de pensie al decedatului (dacă era pensionar)" },
    { key: "certificatDecesNumar", label: "Certificat de deces — serie/număr", required: true },
    { key: "certificatDecesData", label: "Certificat de deces — data eliberării", required: true, validate: "date" },
    { key: "certificatDecesEmitent", label: "Certificat de deces — emitent", required: true },
    { key: "calitateSolicitant", label: "Calitatea solicitantului față de decedat", required: true },
    { key: "modalitatePlata", label: "Modalitatea de plată", required: true },
    { key: "casaPensiiAjutor", label: "Casa de pensii (domiciliul decedatului)", required: true },
  ],
  channels: [
    { id: "casa", label: "Casa județeană/sectorială de pensii — domiciliul decedatului", url: "https://www.cnpp.ro/en/ajutorul-de-deces", instructions: "Depune cererea (Anexa 11) cu certificatul de deces, actul de identitate, dovada cheltuielilor de înmormântare (factură + chitanță) sau declarația pe propria răspundere. Sub Legea 360/2023 plata o face exclusiv casa de pensii. Termen: 3 ani de la data decesului." },
    { id: "posta", label: "Prin poștă sau e-mail către casa de pensii", url: null, instructions: "Cererea și copiile pot fi trimise prin poștă sau e-mail la casa județeană; originalele se prezintă ulterior la ghișeu." },
  ],
};

export const PENSIE_URMAS_MANIFEST: FormManifest = {
  id: "PENSIE-URMAS-national-2024",
  authority: "Casa Teritorială/Județeană de Pensii (CNPP)",
  jurisdiction: "national",
  formCode: "PENSIE-URMAS",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: "https://www.cnpp.ro/en/pensia-de-urmas",
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere pentru acordarea pensiei de urmaș (Anexa 7)",
  fields: [
    ...solicitant,
    ...decedat,
    { key: "calitateUrmas", label: "Calitatea solicitantului față de susținătorul decedat", source: { from: "input", key: "calitateUrmas" }, required: true },
    { key: "titulariUrmasi", label: "Urmași (titulari) pentru care se solicită pensia", source: { from: "input", key: "titulariUrmasi" }, required: true },
    { key: "cauzaDeces", label: "Cauza decesului", source: { from: "input", key: "cauzaDeces" } },
    { key: "casaPensiiUrmas", label: "Casa de pensii competentă (domiciliul solicitantului)", source: { from: "input", key: "casaPensiiUrmas" }, required: true },
  ],
  inputs: [
    { key: "calitateUrmas", label: "Calitatea solicitantului (soț supraviețuitor/copil)", required: true },
    { key: "titulariUrmasi", label: "Urmași (titulari) — nume și calitate", required: true },
    { key: "cauzaDeces", label: "Cauza decesului (obișnuit/accident de muncă/boală profesională)" },
    { key: "casaPensiiUrmas", label: "Casa de pensii (domiciliul solicitantului)", required: true },
  ],
  channels: [
    { id: "casa", label: "Casa județeană de pensii — domiciliul solicitantului", url: "https://www.cnpp.ro/en/pensia-de-urmas", instructions: "Depune cererea (Anexa 7) la casa de pensii de la domiciliul tău, cu certificatul de deces, actele de stare civilă care dovedesc rudenia și, pentru copiii peste 16 ani, adeverința de continuare a studiilor." },
  ],
};

// Validare la granița dosarului de deces. Enum pe calități/plată/cauză; dată pe
// data decesului și a certificatului; CNP-ul verificat în motor (mapForm).
export const DecesBodySchema = z.object({
  decedatNume: z.string().max(200).optional(),
  decedatCnp: z.string().max(20).optional(),
  dataDeces: optionalDateString,
  decedatCalitate: optionalEnum(DECEDAT_CALITATE),
  decedatDosarPensie: z.string().max(60).optional(),
  certificatDecesNumar: z.string().max(60).optional(),
  certificatDecesData: optionalDateString,
  certificatDecesEmitent: z.string().max(200).optional(),
  calitateSolicitant: optionalEnum(CALITATE_SOLICITANT_DECES),
  modalitatePlata: optionalEnum(MODALITATE_PLATA_DECES),
  calitateUrmas: optionalEnum(CALITATE_URMAS),
  titulariUrmasi: z.string().max(500).optional(),
  cauzaDeces: optionalEnum(CAUZA_DECES),
  casaPensiiAjutor: z.string().max(200).optional(),
  casaPensiiUrmas: z.string().max(200).optional(),
});

export function registerDeces(): void {
  registerManifest(AJUTOR_DECES_MANIFEST);
  registerManifest(PENSIE_URMAS_MANIFEST);
}
