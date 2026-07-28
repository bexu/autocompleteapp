import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";
import { optionalDateString, optionalEnum } from "@/lib/validation/zod";

// Urbanism / construcții (Legea 50/1991; formulare-model din Ordinul MDRL
// 839/2009). Solicitantul din profil; imobilul din entitatea Imobil. Eveniment:
// „certificat de urbanism" (F.1, act prealabil) sau „autorizație de construire/
// desființare" (F.8, cere nr. certificatului). Unealtă, nu consultant: nu dăm
// avize, nu calculăm taxe. Sursă oficială verificată (legea); PDF-ul la obținere.

const LEGE = "https://legislatie.just.ro/Public/DetaliiDocument/1515";

export const SCOP_CERTIFICAT = [
  "Construire",
  "Desființare",
  "Informare / operațiuni notariale",
  "Dezmembrare",
  "Parcelare",
  "Alipire (comasare)",
  "Cerere în justiție",
  "Alt scop prevăzut de lege",
] as const;
export const TIP_OBIECT = ["Teren", "Construcții", "Teren și construcții"] as const;
export const TIP_LUCRARE = ["Construire", "Desființare"] as const;

const solicitant: FieldDef[] = [
  { key: "nume", label: "Solicitant — nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Solicitant — prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "Solicitant — CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "telefon", label: "Telefon", source: { from: "profile", path: "telefon" } },
  { key: "domiciliuJudet", label: "Domiciliu — județ", source: { from: "profile", path: "addresses.0.judet" } },
  { key: "domiciliuLocalitate", label: "Domiciliu — localitate", source: { from: "profile", path: "addresses.0.localitate" } },
];

const imobilFields: FieldDef[] = [
  { key: "imobilJudet", label: "Imobil — județ", source: { from: "imobil", path: "judet" } },
  { key: "imobilUAT", label: "Imobil — localitate/UAT", source: { from: "imobil", path: "localitate" }, required: true },
  { key: "imobilStrada", label: "Imobil — stradă", source: { from: "imobil", path: "strada" } },
  { key: "imobilNr", label: "Imobil — număr", source: { from: "imobil", path: "nr" } },
  { key: "imobilCadastral", label: "Nr. cadastral", source: { from: "imobil", path: "nrCadastral" } },
  { key: "imobilCf", label: "Nr. carte funciară", source: { from: "imobil", path: "nrCarteFunciara" } },
  { key: "imobilSuprafata", label: "Suprafață (mp)", source: { from: "imobil", path: "suprafataMp" } },
];

const emitent = "Autoritatea publică locală emitentă (primăria UAT / consiliul județean, după competența teritorială — art. 4 Legea 50/1991)";
// url: null — ghișeul competent variază pe UAT (nu există un URL național unic);
// temeiul legal (Legea 50/1991) stă în sourceUrl, nu în canalul de depunere.
const ghiseuChannel = { id: "ghiseu", label: "Ghișeu unic / registratura autorității emitente", url: null, instructions: "Depune cererea la primăria UAT sau la consiliul județean competent (după unde se află imobilul), cu extrasul de carte funciară, planul cadastral/topografic și dovada achitării taxei." };
const onlineChannel = { id: "online", label: "Online — portalul primăriei / plata taxei (ghiseul.ro)", url: null, instructions: "Unele autorități permit depunerea online cu semnătură electronică; taxa se poate achita prin portalul național ghiseul.ro." };

export const CERTIFICAT_URBANISM_MANIFEST: FormManifest = {
  id: "CERTIFICAT-URBANISM-national-2009",
  authority: emitent,
  jurisdiction: "national",
  formCode: "CERTIFICAT-URBANISM",
  revision: "2009",
  validFrom: "2009-01-01",
  sourceUrl: LEGE,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere pentru emiterea certificatului de urbanism (F.1)",
  fields: [
    ...solicitant,
    ...imobilFields,
    { key: "scopSolicitare", label: "Scopul solicitării", source: { from: "input", key: "scopSolicitare" }, required: true },
    { key: "tipObiectImobil", label: "Imobilul vizat (teren/construcții)", source: { from: "input", key: "tipObiectImobil" }, required: true },
    { key: "descriereScop", label: "Descrierea scopului/lucrării", source: { from: "input", key: "descriereScop" }, required: true },
  ],
  inputs: [
    { key: "scopSolicitare", label: "Scopul solicitării certificatului", required: true },
    { key: "tipObiectImobil", label: "Imobilul vizat este teren, construcții sau ambele", required: true },
    { key: "descriereScop", label: "Descrierea scopului / a lucrării dorite", required: true },
  ],
  channels: [ghiseuChannel, onlineChannel],
};

export const AUTORIZATIE_CONSTRUIRE_MANIFEST: FormManifest = {
  id: "AUTORIZATIE-CONSTRUIRE-national-2009",
  authority: emitent,
  jurisdiction: "national",
  formCode: "AUTORIZATIE-CONSTRUIRE",
  revision: "2009",
  validFrom: "2009-01-01",
  sourceUrl: LEGE,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere pentru emiterea autorizației de construire/desființare (F.8)",
  fields: [
    ...solicitant,
    ...imobilFields,
    { key: "tipLucrare", label: "Tipul lucrării", source: { from: "input", key: "tipLucrare" }, required: true },
    { key: "descriereLucrare", label: "Denumirea și descrierea lucrărilor", source: { from: "input", key: "descriereLucrare" }, required: true },
    { key: "valoareLucrari", label: "Valoarea declarată a lucrărilor (lei)", source: { from: "input", key: "valoareLucrari" }, required: true },
    { key: "certificatUrbanismNumar", label: "Certificat de urbanism — număr", source: { from: "input", key: "certificatUrbanismNumar" }, required: true },
    { key: "certificatUrbanismData", label: "Certificat de urbanism — data emiterii", source: { from: "input", key: "certificatUrbanismData" }, required: true, validate: "date" },
    { key: "proiectant", label: "Proiectant (arhitect cu drept de semnătură / firmă)", source: { from: "input", key: "proiectant" }, required: true },
    { key: "durataExecutieLuni", label: "Durata estimată a execuției (luni)", source: { from: "input", key: "durataExecutieLuni" } },
  ],
  inputs: [
    { key: "tipLucrare", label: "Tipul lucrării (construire/desființare)", required: true },
    { key: "descriereLucrare", label: "Denumirea și descrierea lucrărilor", required: true },
    { key: "valoareLucrari", label: "Valoarea declarată a lucrărilor (lei)", required: true },
    { key: "certificatUrbanismNumar", label: "Certificatul de urbanism — număr", required: true },
    { key: "certificatUrbanismData", label: "Certificatul de urbanism — data emiterii", required: true, validate: "date" },
    { key: "proiectant", label: "Proiectant cu drept de semnătură", required: true },
    { key: "durataExecutieLuni", label: "Durata estimată a execuției (luni)" },
  ],
  channels: [ghiseuChannel, onlineChannel],
};

export const URBANISM_EVENTS = ["CERTIFICAT", "AUTORIZATIE"] as const;
export type UrbanismEvent = (typeof URBANISM_EVENTS)[number];

export const URBANISM_EVENT_FORMS: Record<UrbanismEvent, readonly string[]> = {
  CERTIFICAT: ["CERTIFICAT-URBANISM"],
  AUTORIZATIE: ["AUTORIZATIE-CONSTRUIRE"],
};

// Validare la granița dosarului de urbanism. imobilId identifică proprietatea;
// enum pe scop/tip; valoarea și durata ca numere; data certificatului ca dată.
export const UrbanismBodySchema = z.object({
  event: z.enum(URBANISM_EVENTS),
  imobilId: z.string().min(1, "imobil lipsă"),
  // Certificat de urbanism
  scopSolicitare: optionalEnum(SCOP_CERTIFICAT),
  tipObiectImobil: optionalEnum(TIP_OBIECT),
  descriereScop: z.string().max(1000).optional(),
  // Autorizație
  tipLucrare: optionalEnum(TIP_LUCRARE),
  descriereLucrare: z.string().max(1000).optional(),
  valoareLucrari: z
    .string()
    .max(20)
    .refine((v) => v === "" || /^\d+([.,]\d{1,2})?$/.test(v), "valoare invalidă")
    .optional(),
  certificatUrbanismNumar: z.string().max(60).optional(),
  certificatUrbanismData: optionalDateString,
  proiectant: z.string().max(200).optional(),
  durataExecutieLuni: z
    .string()
    .max(4)
    .refine((v) => v === "" || /^\d{1,3}$/.test(v), "durată invalidă")
    .optional(),
});

export function registerUrbanism(): void {
  registerManifest(CERTIFICAT_URBANISM_MANIFEST);
  registerManifest(AUTORIZATIE_CONSTRUIRE_MANIFEST);
}
