import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";
import { isValidDate } from "@/lib/validation/date";

// Dosar cadastru / carte funciară (ANCPI/OCPI, Legea 7/1996; formularul „Cerere
// de înscriere" = Anexa 5 la Regulamentul aprobat prin ODG ANCPI 600/2023).
// Solicitantul din profil; imobilul din entitatea Imobil; operațiunea + actul
// justificativ ca inputuri. Extrasul CF e un pas de tip dosar/link (portalul
// ANCPI îl emite). Unealtă, nu consultant: nu dăm sfaturi juridice, nu calculăm
// tarife. Sursă oficială verificată (ancpi.ro); sourceSha256 null până la PDF.

export const FEL_INSCRIERE = [
  "Intabulare",
  "Înscriere provizorie",
  "Notare",
  "Radiere",
  "Actualizare informații tehnice",
  "Îndreptare eroare materială",
] as const;

export const MOD_COMUNICARE = ["La sediul biroului", "Poștă", "E-mail"] as const;
export const REGIM_SOLUTIONARE = ["Normal", "Urgență"] as const;
export const SCOP_EXTRAS = [
  "Extras de carte funciară pentru informare",
  "Extras din planul cadastral",
  "Ambele",
] as const;
export const CALITATE_SOLICITANT = ["Proprietar tabular", "Terț"] as const;

const solicitant: FieldDef[] = [
  { key: "nume", label: "Solicitant — nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Solicitant — prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "Solicitant — CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "telefon", label: "Telefon", source: { from: "profile", path: "telefon" } },
  { key: "domiciliuJudet", label: "Domiciliu — județ", source: { from: "profile", path: "addresses.0.judet" } },
  { key: "domiciliuLocalitate", label: "Domiciliu — localitate", source: { from: "profile", path: "addresses.0.localitate" } },
];

const imobilFields: FieldDef[] = [
  // Localitatea (UAT) identifică BCPI competent — obligatorie (ca la impozit);
  // județul e util dar nu-l forțăm (nu e obligatoriu pe entitatea Imobil).
  { key: "imobilJudet", label: "Imobil — județ", source: { from: "imobil", path: "judet" } },
  { key: "imobilUAT", label: "Imobil — UAT/localitate", source: { from: "imobil", path: "localitate" }, required: true },
  { key: "imobilStrada", label: "Imobil — stradă", source: { from: "imobil", path: "strada" } },
  { key: "imobilNr", label: "Imobil — număr", source: { from: "imobil", path: "nr" } },
  { key: "imobilCadastral", label: "Nr. cadastral/topografic", source: { from: "imobil", path: "nrCadastral" } },
  { key: "imobilCf", label: "Nr. carte funciară", source: { from: "imobil", path: "nrCarteFunciara" } },
];

export const CERERE_INSCRIERE_CF_MANIFEST: FormManifest = {
  id: "CERERE-INSCRIERE-CF-national-2023",
  authority: "ANCPI / OCPI — Biroul de Cadastru și Publicitate Imobiliară",
  jurisdiction: "national",
  formCode: "CERERE-INSCRIERE-CF",
  revision: "2023",
  validFrom: "2023-01-01",
  sourceUrl: "https://www.ancpi.ro",
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere de înscriere în cartea funciară (Anexa 5)",
  fields: [
    ...solicitant,
    ...imobilFields,
    { key: "felInscriere", label: "Felul înscrierii", source: { from: "input", key: "felInscriere" }, required: true },
    { key: "descriereDrept", label: "Dreptul/faptul de înscris", source: { from: "input", key: "descriereDrept" }, required: true },
    { key: "actTip", label: "Act justificativ — tip", source: { from: "input", key: "actTip" }, required: true },
    { key: "actNumar", label: "Act justificativ — număr", source: { from: "input", key: "actNumar" }, required: true },
    { key: "actData", label: "Act justificativ — dată", source: { from: "input", key: "actData" }, required: true, validate: "date" },
    { key: "actEmitent", label: "Act justificativ — emitent", source: { from: "input", key: "actEmitent" }, required: true },
    { key: "modComunicare", label: "Modalitatea de comunicare a răspunsului", source: { from: "input", key: "modComunicare" }, required: true },
    { key: "regimSolutionare", label: "Regim de soluționare", source: { from: "input", key: "regimSolutionare" } },
  ],
  inputs: [
    { key: "felInscriere", label: "Felul înscrierii", required: true },
    { key: "descriereDrept", label: "Dreptul/faptul de înscris (ex. drept de proprietate, ipotecă)", required: true },
    { key: "actTip", label: "Tipul actului justificativ (notarial, hotărâre, certificat de moștenitor…)", required: true },
    { key: "actNumar", label: "Numărul actului", required: true },
    { key: "actData", label: "Data actului", required: true, validate: "date" },
    { key: "actEmitent", label: "Emitentul actului (notar/instanță/autoritate)", required: true },
    { key: "modComunicare", label: "Comunicarea răspunsului", required: true },
    { key: "regimSolutionare", label: "Regim de soluționare (normal/urgență)" },
  ],
  channels: [
    { id: "bcpi", label: "Ghișeu BCPI/OCPI competent (unde se află imobilul)", url: "https://www.ancpi.ro", instructions: "Depune cererea de înscriere, semnată olograf, la Biroul de Cadastru și Publicitate Imobiliară în raza căruia se află imobilul, cu actul justificativ (original/copie legalizată), dovada plății tarifului și copia actului de identitate." },
    { id: "eterra", label: "Electronic prin notar / persoană autorizată (eTerra)", url: "https://www.ancpi.ro", instructions: "Pentru acte notariale, notarul poate depune cererea electronic prin sistemul ANCPI (eTerra), cu semnătură electronică calificată." },
  ],
};

export const EXTRAS_CF_MANIFEST: FormManifest = {
  id: "EXTRAS-CF-national-2023",
  authority: "ANCPI — OCPI/BCPI (servicii online)",
  jurisdiction: "national",
  formCode: "EXTRAS-CF",
  revision: "2023",
  validFrom: "2023-01-01",
  sourceUrl: "https://www.ancpi.ro",
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere extras de carte funciară / plan cadastral (pre-verificare)",
  fields: [
    { key: "nume", label: "Solicitant — nume", source: { from: "profile", path: "nume" }, required: true },
    { key: "prenume", label: "Solicitant — prenume", source: { from: "profile", path: "prenume" }, required: true },
    ...imobilFields,
    { key: "scopExtras", label: "Tipul extrasului", source: { from: "input", key: "scopExtras" }, required: true },
    { key: "calitateSolicitant", label: "Calitatea solicitantului", source: { from: "input", key: "calitateSolicitant" } },
  ],
  inputs: [
    { key: "scopExtras", label: "Tipul extrasului dorit", required: true },
    { key: "calitateSolicitant", label: "Calitatea solicitantului (proprietar/terț)" },
  ],
  channels: [
    { id: "epay", label: "Online — portalul ANCPI (ePayment / MyEterra)", url: "https://www.ancpi.ro", instructions: "Extrasul de carte funciară pentru informare se obține online de pe portalul ANCPI: gratuit prin serviciul MyEterra dacă ești proprietar tabular, sau contra cost prin ePayment ANCPI dacă ești terț. Extrasul pentru informare NU este valabil pentru autentificarea unei tranzacții la notar." },
    { id: "ghiseu", label: "La ghișeu / poștă — OCPI/BCPI teritorial", url: "https://www.ancpi.ro", instructions: "Alternativ, extrasul se poate solicita la ghișeul OCPI/BCPI teritorial, contra tariful în vigoare." },
  ],
};

// Enum opțional venit dintr-un <select>: un „—" trimite "" (nu undefined), deci
// tratăm "" ca „necompletat" înainte de validarea enum-ului.
function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((v) => (v === "" ? undefined : v), z.enum(values).optional());
}

// Validare la granița dosarului de cadastru. imobilId identifică proprietatea;
// enum pe felul înscrierii / comunicare / regim / scop extras; dată pe actData.
export const CadastruBodySchema = z.object({
  imobilId: z.string().min(1, "imobil lipsă"),
  felInscriere: optionalEnum(FEL_INSCRIERE),
  descriereDrept: z.string().max(500).optional(),
  actTip: z.string().max(200).optional(),
  actNumar: z.string().max(60).optional(),
  actData: z
    .string()
    .max(30)
    .refine((v) => v === "" || isValidDate(v), "dată invalidă")
    .optional(),
  actEmitent: z.string().max(200).optional(),
  modComunicare: optionalEnum(MOD_COMUNICARE),
  regimSolutionare: optionalEnum(REGIM_SOLUTIONARE),
  scopExtras: optionalEnum(SCOP_EXTRAS),
  calitateSolicitant: optionalEnum(CALITATE_SOLICITANT),
});

export function registerCadastru(): void {
  registerManifest(CERERE_INSCRIERE_CF_MANIFEST);
  registerManifest(EXTRAS_CF_MANIFEST);
}
