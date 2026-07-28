import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";

// Manifestele formularelor auto (Faza 2). Câmpurile logice reflectă conținutul
// real al formularelor. Sursa oficială (PDF) + hash se completează la obținere;
// până atunci workflow = "generated" și sourceUrl/hash = null (guardrail).
//
// ITL-054 contract înstrăinare-dobândire · ITL-005 declarare la taxe locale ·
// ITL-016 scoatere din evidență · ITL-010 cerere certificat atestare fiscală ·
// DGPCI cerere înmatriculare/transcriere/radiere.

const person: FieldDef[] = [
  { key: "nume", label: "Nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "judet", label: "Județ", source: { from: "profile", path: "addresses.0.judet" } },
  { key: "localitate", label: "Localitate", source: { from: "profile", path: "addresses.0.localitate" } },
  { key: "strada", label: "Stradă", source: { from: "profile", path: "addresses.0.strada" } },
  { key: "nrAdresa", label: "Număr", source: { from: "profile", path: "addresses.0.nr" } },
];

const vehicleCore: FieldDef[] = [
  { key: "vin", label: "VIN", source: { from: "vehicle", path: "vin" }, required: true },
  { key: "marca", label: "Marcă", source: { from: "vehicle", path: "marca" } },
  { key: "model", label: "Model", source: { from: "vehicle", path: "model" } },
  { key: "nrInmatriculare", label: "Nr. înmatriculare", source: { from: "vehicle", path: "nrInmatriculare" } },
  { key: "serieMotor", label: "Serie motor", source: { from: "vehicle", path: "serieMotor" } },
  { key: "cilindreeCm3", label: "Cilindree (cm³)", source: { from: "vehicle", path: "cilindreeCm3" } },
  { key: "anFabricatie", label: "An fabricație", source: { from: "vehicle", path: "anFabricatie" } },
  { key: "combustibil", label: "Combustibil", source: { from: "vehicle", path: "combustibil" } },
];

// Câmpuri de fiscalitate cerute de ITL-005 Cluj rev. 2026.
const vehicleFiscal2026: FieldDef[] = [
  { key: "masaMaximaKg", label: "Masă maximă (kg)", source: { from: "vehicle", path: "masaMaximaKg" } },
  { key: "normaPoluare", label: "Normă de poluare", source: { from: "vehicle", path: "normaPoluare" } },
  { key: "emisiiCo2GKm", label: "Emisii CO₂ (g/km)", source: { from: "vehicle", path: "emisiiCo2GKm" } },
  { key: "putereKw", label: "Putere (kW)", source: { from: "vehicle", path: "putereKw" } },
];

function baseManifest(over: Partial<FormManifest> & Pick<FormManifest, "id" | "formCode" | "jurisdiction" | "revision" | "validFrom" | "title" | "fields" | "inputs">): FormManifest {
  return {
    authority: "UAT",
    sourceUrl: null,
    sourceSha256: null,
    workflow: "generated",
    signature: "none",
    channels: [],
    ...over,
  };
}

export const ITL_005_CLUJ_2026: FormManifest = baseManifest({
  id: "ITL-005-cluj-2026",
  authority: "Primăria Cluj-Napoca",
  jurisdiction: "cluj",
  formCode: "ITL-005",
  revision: "2026",
  validFrom: "2026-01-01",
  title: "ITL-005 — Declarare vehicul la taxe locale",
  fields: [...person, ...vehicleCore, ...vehicleFiscal2026,
    { key: "dataDobandire", label: "Data dobândirii", source: { from: "vehicle", path: "dataDobandire" } },
  ],
  inputs: [],
  channels: [
    { id: "itl-cluj", label: "Direcția de Taxe și Impozite Locale Cluj", url: null, instructions: "Depune declarația la ghișeul DITL sau online, cu actele vehiculului." },
  ],
});

export const ITL_016_CLUJ: FormManifest = baseManifest({
  id: "ITL-016-cluj-2024",
  authority: "Primăria Cluj-Napoca",
  jurisdiction: "cluj",
  formCode: "ITL-016",
  revision: "2024",
  validFrom: "2024-01-01",
  title: "ITL-016 — Scoaterea vehiculului din evidența fiscală",
  fields: [...person, ...vehicleCore,
    { key: "dataInstrainare", label: "Data înstrăinării", source: { from: "input", key: "dataInstrainare" }, required: true, validate: "date" },
    { key: "dobanditorNume", label: "Dobânditor (nume)", source: { from: "input", key: "dobanditorNume" }, required: true },
  ],
  inputs: [
    { key: "dataInstrainare", label: "Data înstrăinării", required: true },
    { key: "dobanditorNume", label: "Numele dobânditorului", required: true },
  ],
  channels: [
    { id: "itl-cluj", label: "Direcția de Taxe și Impozite Locale Cluj", url: null, instructions: "Depune cererea de scoatere din evidență, cu contractul de înstrăinare." },
  ],
});

export const ITL_010_CLUJ: FormManifest = baseManifest({
  id: "ITL-010-cluj-2024",
  authority: "Primăria Cluj-Napoca",
  jurisdiction: "cluj",
  formCode: "ITL-010",
  revision: "2024",
  validFrom: "2024-01-01",
  title: "ITL-010 — Cerere certificat de atestare fiscală",
  fields: [...person,
    { key: "scop", label: "Scopul cererii", source: { from: "input", key: "scop" } },
  ],
  inputs: [{ key: "scop", label: "Scopul (ex. înstrăinare vehicul)" }],
  channels: [
    { id: "itl-cluj", label: "Direcția de Taxe și Impozite Locale Cluj", url: null, instructions: "Solicită certificatul de atestare fiscală (necesar la înstrăinare)." },
  ],
});

export const ITL_054_NATIONAL: FormManifest = baseManifest({
  id: "ITL-054-national-2024",
  authority: "ANAF/UAT (model oficial)",
  jurisdiction: "national",
  formCode: "ITL-054",
  revision: "2024",
  validFrom: "2024-01-01",
  title: "ITL-054 — Contract de înstrăinare-dobândire a unui mijloc de transport",
  fields: [
    // Vânzător = utilizatorul (din profil).
    { key: "vanzatorNume", label: "Vânzător — nume", source: { from: "profile", path: "nume" }, required: true },
    { key: "vanzatorPrenume", label: "Vânzător — prenume", source: { from: "profile", path: "prenume" }, required: true },
    { key: "vanzatorCnp", label: "Vânzător — CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
    // Cumpărător = contrapartea (input).
    { key: "cumparatorNume", label: "Cumpărător — nume complet", source: { from: "input", key: "cumparatorNume" }, required: true },
    { key: "cumparatorCnp", label: "Cumpărător — CNP", source: { from: "input", key: "cumparatorCnp" }, required: true, validate: "cnp" },
    ...vehicleCore,
    { key: "pret", label: "Preț (lei)", source: { from: "input", key: "pret" }, required: true },
    { key: "dataContract", label: "Data contractului", source: { from: "input", key: "dataContract" }, required: true, validate: "date" },
  ],
  inputs: [
    { key: "cumparatorNume", label: "Nume complet cumpărător", required: true },
    { key: "cumparatorCnp", label: "CNP cumpărător", required: true, validate: "cnp" },
    { key: "pret", label: "Preț (lei)", required: true },
    { key: "dataContract", label: "Data contractului", required: true },
  ],
});

export const DGPCI_NATIONAL: FormManifest = baseManifest({
  id: "DGPCI-national-2024",
  authority: "DGPCI",
  jurisdiction: "national",
  formCode: "DGPCI",
  revision: "2024",
  validFrom: "2024-01-01",
  title: "Cerere DGPCI — înmatriculare / transcriere / radiere",
  fields: [...person, ...vehicleCore,
    { key: "tipCerere", label: "Tip cerere", source: { from: "input", key: "tipCerere" }, required: true },
  ],
  inputs: [
    { key: "tipCerere", label: "Tip (înmatriculare / transcriere / radiere)", required: true },
  ],
  channels: [
    { id: "dgpci", label: "DGPCI / SPCRPCIV", url: null, instructions: "Programează-te și depune cererea cu actele vehiculului și dovada asigurării." },
  ],
});

export const AUTO_MANIFESTS: FormManifest[] = [
  ITL_005_CLUJ_2026,
  ITL_016_CLUJ,
  ITL_010_CLUJ,
  ITL_054_NATIONAL,
  DGPCI_NATIONAL,
];

export function registerAuto(): void {
  for (const m of AUTO_MANIFESTS) registerManifest(m);
}
