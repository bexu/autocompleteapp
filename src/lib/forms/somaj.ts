import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";
import { isValidDate } from "@/lib/validation/date";

// Dosar de șomaj (ANOFM, Legea 76/2002; procedura Ordin ANOFM 85/2002 mod. 286/2020).
// Două formulare reale: fișa de înregistrare ca persoană în căutarea unui loc de
// muncă (Anexa 1) + cererea de indemnizație de șomaj (Anexa 3). Solicitantul din
// profil; restul ca inputuri. Unealtă, nu consultant: NU evaluăm eligibilitatea,
// stagiul de cotizare, durata sau cuantumul — doar completăm mecanic formularele.
// Sursă oficială verificată (pagină ANOFM); sourceSha256 rămâne null până la
// integrarea PDF-ului oficial (workflow = "generated").

const solicitant: FieldDef[] = [
  { key: "nume", label: "Nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "telefon", label: "Telefon", source: { from: "profile", path: "telefon" } },
  { key: "domiciliuJudet", label: "Domiciliu — județ", source: { from: "profile", path: "addresses.0.judet" } },
  { key: "domiciliuLocalitate", label: "Domiciliu — localitate", source: { from: "profile", path: "addresses.0.localitate" } },
];

// Date despre ultimul loc de muncă — obligatorii pe cererea de indemnizație,
// informative pe fișa de înregistrare.
const ultimulLoc = (required: boolean): FieldDef[] => [
  { key: "ultimulAngajator", label: "Ultimul angajator", source: { from: "input", key: "ultimulAngajator" }, required },
  { key: "dataIncetare", label: "Data încetării raportului de muncă", source: { from: "input", key: "dataIncetare" }, required, validate: "date" },
  { key: "motivIncetare", label: "Motivul/temeiul încetării", source: { from: "input", key: "motivIncetare" }, required },
];

export const INREGISTRARE_ANOFM_MANIFEST: FormManifest = {
  id: "INREGISTRARE-ANOFM-national-2024",
  authority: "ANOFM (AJOFM/ALOFM județean)",
  jurisdiction: "national",
  formCode: "INREGISTRARE-ANOFM",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: "https://www.anofm.ro/inregistrarea-somerilor/",
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Fișă de înregistrare ca persoană în căutarea unui loc de muncă",
  fields: [
    ...solicitant,
    { key: "ultimaFormaInvatamant", label: "Ultima formă de învățământ absolvită", source: { from: "input", key: "ultimaFormaInvatamant" }, required: true },
    { key: "actAbsolvire", label: "Act de absolvire (serie, nr., dată, autoritate)", source: { from: "input", key: "actAbsolvire" }, required: true },
    { key: "stareCivila", label: "Starea civilă", source: { from: "input", key: "stareCivila" }, required: true },
    { key: "cetatenie", label: "Cetățenia", source: { from: "input", key: "cetatenie" }, required: true },
    { key: "capacitateMunca", label: "Capacitatea de muncă / restricții medicale", source: { from: "input", key: "capacitateMunca" }, required: true },
    { key: "experientaProfesionala", label: "Experiență profesională", source: { from: "input", key: "experientaProfesionala" } },
    ...ultimulLoc(false),
    { key: "ocupatiiDorite", label: "Ocupații dorite pentru mediere (până la 3)", source: { from: "input", key: "ocupatiiDorite" } },
    { key: "resedinta", label: "Reședința (dacă diferă de domiciliu)", source: { from: "input", key: "resedinta" } },
  ],
  inputs: [
    { key: "ultimaFormaInvatamant", label: "Ultima formă de învățământ absolvită", required: true },
    { key: "actAbsolvire", label: "Act de absolvire (serie, nr., dată, autoritate)", required: true },
    { key: "stareCivila", label: "Starea civilă", required: true },
    { key: "cetatenie", label: "Cetățenia", required: true },
    { key: "capacitateMunca", label: "Capacitatea de muncă / restricții medicale", required: true },
    { key: "experientaProfesionala", label: "Experiență profesională (ocupații, perioade, angajatori)" },
    { key: "ocupatiiDorite", label: "Ocupații dorite pentru mediere (până la 3)" },
    { key: "resedinta", label: "Reședința (dacă diferă de domiciliu)" },
  ],
  channels: [
    { id: "ghiseu", label: "La ghișeu — AJOFM/ALOFM din raza domiciliului sau reședinței", url: "https://www.anofm.ro/inregistrarea-somerilor/", instructions: "Prezintă-te la agenția județeană/locală pentru ocuparea forței de muncă din raza domiciliului (sau reședinței), cu actul de identitate, actele de studii/calificare, CV și adeverința medicală. Serviciul de mediere este gratuit și fără termen." },
    { id: "email", label: "Prin e-mail — dosar scanat PDF la AJOFM județean", url: "https://www.anofm.ro/agentii-judetene/", instructions: "Trimite dosarul scanat (fișa/cererea, CI, acte de studii, adeverință medicală, acord GDPR) pe adresa de e-mail publicată pe pagina AJOFM din județul tău (secțiunea Contact de pe anofm.ro). Cere și păstrează confirmarea de primire." },
    { id: "puls", label: "Online (parțial) — platforma PULS/SEMM ANOFM", url: "https://puls.anofm.ro", instructions: "Creează cont pe platforma PULS/SEMM cu e-mail personal și confirmă adresa pentru înscrierea în baza de date de mediere; unele operațiuni se finalizează la agenție." },
  ],
};

export const SOMAJ_MANIFEST: FormManifest = {
  id: "SOMAJ-national-2024",
  authority: "ANOFM (AJOFM județean)",
  jurisdiction: "national",
  formCode: "SOMAJ",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: "https://www.anofm.ro/indemnizatie-de-somaj-pentru-persoanele-cu-experienta-in-munca/",
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere pentru acordarea indemnizației de șomaj",
  fields: [
    ...solicitant,
    { key: "iban", label: "IBAN (pentru virament)", source: { from: "profile", path: "iban" }, validate: "iban" },
    ...ultimulLoc(true),
    { key: "adeverintaMedicala", label: "Adeverință medicală (nr. și dată)", source: { from: "input", key: "adeverintaMedicala" }, required: true },
    { key: "optiunePlata", label: "Opțiune de plată", source: { from: "input", key: "optiunePlata" }, required: true },
    { key: "acteFinanciare", label: "Acte de la organele financiare (nr. și dată), dacă e cazul", source: { from: "input", key: "acteFinanciare" } },
    { key: "alteActe", label: "Alte acte anexate", source: { from: "input", key: "alteActe" } },
  ],
  inputs: [
    { key: "ultimulAngajator", label: "Ultimul angajator", required: true },
    { key: "dataIncetare", label: "Data încetării raportului de muncă", required: true, validate: "date" },
    { key: "motivIncetare", label: "Motivul/temeiul încetării", required: true },
    { key: "adeverintaMedicala", label: "Adeverință medicală (nr. și dată)", required: true },
    { key: "optiunePlata", label: "Opțiune de plată (virament bancar / mandat poștal)", required: true },
    { key: "acteFinanciare", label: "Acte de la organele financiare (nr. și dată)" },
    { key: "alteActe", label: "Alte acte anexate" },
  ],
  channels: [
    { id: "ghiseu", label: "La ghișeu — AJOFM din raza domiciliului sau reședinței", url: "https://www.anofm.ro/indemnizatie-de-somaj-pentru-persoanele-cu-experienta-in-munca/", instructions: "Depune dosarul complet personal la AJOFM: cererea, actul de identitate, carnetul de muncă și adeverința prevăzută la art. 18 din normele metodologice (de la fostul angajator, cu data și motivul încetării și stagiul de cotizare), adeverința medicală." },
    { id: "email", label: "Prin e-mail — acte scanate la AJOFM județean", url: "https://www.anofm.ro/agentii-judetene/", instructions: "Transmite actele scanate (PDF/JPG/PNG) pe adresa de e-mail publicată pe pagina AJOFM din județul tău (Contact, pe anofm.ro) și păstrează confirmarea de primire." },
  ],
};

// Validare la granița wizardului de șomaj (input extern → Zod). Enum pe opțiunea
// de plată; formatul datei verificat suplimentar (dincolo de plafonul de lungime).
export const OPTIUNI_PLATA = ["Virament bancar", "Mandat poștal"] as const;

export const SomajBodySchema = z.object({
  ultimaFormaInvatamant: z.string().max(200).optional(),
  actAbsolvire: z.string().max(300).optional(),
  stareCivila: z.string().max(60).optional(),
  cetatenie: z.string().max(60).optional(),
  capacitateMunca: z.string().max(300).optional(),
  experientaProfesionala: z.string().max(1000).optional(),
  ocupatiiDorite: z.string().max(300).optional(),
  resedinta: z.string().max(300).optional(),
  ultimulAngajator: z.string().max(200).optional(),
  dataIncetare: z
    .string()
    .max(30)
    .refine((v) => v === "" || isValidDate(v), "dată invalidă")
    .optional(),
  motivIncetare: z.string().max(300).optional(),
  adeverintaMedicala: z.string().max(120).optional(),
  optiunePlata: z.enum(OPTIUNI_PLATA).optional(),
  acteFinanciare: z.string().max(200).optional(),
  alteActe: z.string().max(300).optional(),
});

export function registerSomaj(): void {
  registerManifest(INREGISTRARE_ANOFM_MANIFEST);
  registerManifest(SOMAJ_MANIFEST);
}
