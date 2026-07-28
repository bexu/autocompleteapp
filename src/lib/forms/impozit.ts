import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";

// Impozit local pe imobile: ITL-001 (clădiri) + ITL-003 (teren). Proprietar din
// profil, imobilul din entitatea Imobil, restul (dobândire, cotă, valoare) ca
// inputuri. Jurisdicție UAT (Cluj). Sursa oficială + hash la obținere; până
// atunci workflow = "generated".

const proprietar: FieldDef[] = [
  { key: "nume", label: "Nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "domiciliuLocalitate", label: "Domiciliu — localitate", source: { from: "profile", path: "addresses.0.localitate" } },
];

const imobilFields: FieldDef[] = [
  { key: "imobilTip", label: "Tip imobil", source: { from: "imobil", path: "tip" }, required: true },
  { key: "imobilLocalitate", label: "Localitate imobil", source: { from: "imobil", path: "localitate" }, required: true },
  { key: "imobilStrada", label: "Stradă imobil", source: { from: "imobil", path: "strada" } },
  { key: "imobilNr", label: "Număr imobil", source: { from: "imobil", path: "nr" } },
  { key: "imobilSuprafata", label: "Suprafață (mp)", source: { from: "imobil", path: "suprafataMp" } },
  { key: "imobilCadastral", label: "Nr. cadastral", source: { from: "imobil", path: "nrCadastral" } },
  { key: "imobilCf", label: "Nr. carte funciară", source: { from: "imobil", path: "nrCarteFunciara" } },
];

export const ITL_001_CLUJ: FormManifest = {
  id: "ITL-001-cluj-2024",
  authority: "Primăria Cluj-Napoca",
  jurisdiction: "cluj",
  formCode: "ITL-001",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: null,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "ITL-001 — Declarare clădire (impozit local)",
  fields: [
    ...proprietar,
    ...imobilFields,
    { key: "dataDobandire", label: "Data dobândirii", source: { from: "input", key: "dataDobandire" }, required: true, validate: "date" },
    { key: "cotaParte", label: "Cotă-parte deținută", source: { from: "input", key: "cotaParte" } },
    { key: "valoareImpozabila", label: "Valoare impozabilă declarată (lei)", source: { from: "input", key: "valoareImpozabila" } },
  ],
  inputs: [
    { key: "dataDobandire", label: "Data dobândirii", required: true },
    { key: "cotaParte", label: "Cotă-parte (ex. 1/1)" },
    { key: "valoareImpozabila", label: "Valoare impozabilă (lei)" },
  ],
  channels: [
    { id: "itl-cluj", label: "Direcția de Taxe și Impozite Locale Cluj", url: null, instructions: "Depune declarația ITL-001 în 30 de zile de la dobândire, cu actele de proprietate." },
  ],
};

export const ITL_003_CLUJ: FormManifest = {
  id: "ITL-003-cluj-2024",
  authority: "Primăria Cluj-Napoca",
  jurisdiction: "cluj",
  formCode: "ITL-003",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: null,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "ITL-003 — Declarare teren (impozit local)",
  fields: [
    ...proprietar,
    ...imobilFields,
    { key: "dataDobandire", label: "Data dobândirii", source: { from: "input", key: "dataDobandire" }, required: true, validate: "date" },
    { key: "cotaParte", label: "Cotă-parte deținută", source: { from: "input", key: "cotaParte" } },
    { key: "categoriaFolosinta", label: "Categoria de folosință", source: { from: "input", key: "categoriaFolosinta" }, required: true },
  ],
  inputs: [
    { key: "dataDobandire", label: "Data dobândirii", required: true },
    { key: "cotaParte", label: "Cotă-parte (ex. 1/1)" },
    { key: "categoriaFolosinta", label: "Categoria de folosință (ex. curți-construcții)", required: true },
  ],
  channels: [
    { id: "itl-cluj", label: "Direcția de Taxe și Impozite Locale Cluj", url: null, instructions: "Depune declarația ITL-003 în 30 de zile de la dobândire, cu actele de proprietate." },
  ],
};

// Validare la granița wizardului de impozit imobil.
export const ImpozitBodySchema = z.object({
  formCode: z.enum(["ITL-001", "ITL-003"]),
  imobilId: z.string().min(1, "imobil lipsă"),
  dataDobandire: z.string().max(30).optional(),
  cotaParte: z.string().max(20).optional(),
  valoareImpozabila: z.string().max(30).optional(),
  categoriaFolosinta: z.string().max(60).optional(),
});

export function registerImpozit(): void {
  registerManifest(ITL_001_CLUJ);
  registerManifest(ITL_003_CLUJ);
}
