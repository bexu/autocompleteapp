import { z } from "zod";
import type { FieldDef, FormManifest } from "./manifest";
import { registerManifest } from "./manifest";
import { optionalDateString, optionalEnum } from "@/lib/validation/zod";

// Ciclul de viață PFA la ONRC (OUG 44/2008; procedură reg. comerțului L265/2022).
// Titularul din profil; restul ca inputuri. Trei formulare: rezervare denumire
// (11-10-181), înregistrare PFA (11-10-180) și mențiuni (schimbare/suspendare/
// reluare/radiere). Unealtă, nu consultant: nu dăm sfaturi, nu calculăm taxe.
// Sursă oficială verificată (onrc.ro); sourceSha256 null până la PDF.

const ONRC = "https://www.onrc.ro/index.php/ro/inmatriculari/persoane-fizice/persoane-fizice-autorizate-pfa";

export const TIP_ENTITATE = ["PFA", "II", "IF"] as const;
export const DOVADA_SPATIU = ["Proprietate", "Închiriere", "Comodat", "Alt titlu"] as const;
export const DA_NU = ["Nu", "Da"] as const;
export const TIP_MENTIUNE = [
  "Schimbare sediu profesional",
  "Adăugare/modificare CAEN",
  "Suspendare activitate",
  "Reluare activitate",
  "Radiere",
] as const;
export const MOTIV_RADIERE = ["Renunțare", "Deces", "Hotărâre judecătorească", "Retragere membri IF"] as const;
export const MOD_ELIBERARE = ["Ghișeu", "Poștă", "Electronic"] as const;

const titular: FieldDef[] = [
  { key: "nume", label: "Titular — nume", source: { from: "profile", path: "nume" }, required: true },
  { key: "prenume", label: "Titular — prenume", source: { from: "profile", path: "prenume" }, required: true },
  { key: "cnp", label: "Titular — CNP", source: { from: "profile", path: "cnp" }, required: true, validate: "cnp" },
  { key: "telefon", label: "Telefon", source: { from: "profile", path: "telefon" } },
  { key: "domiciliuJudet", label: "Domiciliu — județ", source: { from: "profile", path: "addresses.0.judet" } },
  { key: "domiciliuLocalitate", label: "Domiciliu — localitate", source: { from: "profile", path: "addresses.0.localitate" } },
];

const onlineChannel = { id: "portal", label: "Portal online ONRC (myportal.onrc.ro)", url: ONRC, instructions: "Depune dosarul pe portalul ONRC cu semnătură electronică calificată; alternativ, la ghișeul ORCT din județul sediului profesional." };
const ghiseuChannel = { id: "ghiseu", label: "Ghișeu ORCT județean (Registrul Comerțului de pe lângă tribunal)", url: ONRC, instructions: "Depune dosarul la Oficiul Registrului Comerțului din județul sediului profesional, cu actele doveditoare și specimenul de semnătură." };

export const REZERVARE_PFA_MANIFEST: FormManifest = {
  id: "REZERVARE-PFA-national-2024",
  authority: "ONRC — Oficiul Registrului Comerțului",
  jurisdiction: "national",
  formCode: "REZERVARE-PFA",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: ONRC,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere de verificare disponibilitate și rezervare denumire (PFA/II/IF)",
  fields: [
    ...titular,
    { key: "tipEntitate", label: "Forma de organizare", source: { from: "input", key: "tipEntitate" }, required: true },
    { key: "denumirePropusa", label: "Denumire propusă — opțiunea 1", source: { from: "input", key: "denumirePropusa" }, required: true },
    { key: "denumireVarianta2", label: "Denumire propusă — opțiunea 2", source: { from: "input", key: "denumireVarianta2" } },
    { key: "denumireVarianta3", label: "Denumire propusă — opțiunea 3", source: { from: "input", key: "denumireVarianta3" } },
    { key: "judetSediu", label: "Județul sediului profesional", source: { from: "input", key: "judetSediu" }, required: true },
  ],
  inputs: [
    { key: "tipEntitate", label: "Forma de organizare (PFA/II/IF)", required: true },
    { key: "denumirePropusa", label: "Denumire propusă — opțiunea 1", required: true },
    { key: "denumireVarianta2", label: "Denumire propusă — opțiunea 2" },
    { key: "denumireVarianta3", label: "Denumire propusă — opțiunea 3" },
    { key: "judetSediu", label: "Județul sediului profesional", required: true },
  ],
  channels: [onlineChannel, ghiseuChannel],
};

export const INREGISTRARE_PFA_MANIFEST: FormManifest = {
  id: "INREGISTRARE-PFA-national-2024",
  authority: "ONRC — Oficiul Registrului Comerțului",
  jurisdiction: "national",
  formCode: "INREGISTRARE-PFA",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: ONRC,
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere de înregistrare PFA + anexă de înregistrare fiscală",
  fields: [
    ...titular,
    // Județul sediului e un singur input (judetSediu) — folosit și la rezervare
    // și la înregistrare, ca cele două formulare să nu se contrazică.
    { key: "sediuJudet", label: "Sediu profesional — județ", source: { from: "input", key: "judetSediu" }, required: true },
    { key: "sediuLocalitate", label: "Sediu profesional — localitate", source: { from: "input", key: "sediuLocalitate" }, required: true },
    { key: "sediuStrada", label: "Sediu profesional — stradă", source: { from: "input", key: "sediuStrada" }, required: true },
    { key: "sediuNumar", label: "Sediu profesional — număr", source: { from: "input", key: "sediuNumar" }, required: true },
    { key: "sediuDetalii", label: "Sediu — bloc/scară/etaj/ap.", source: { from: "input", key: "sediuDetalii" } },
    { key: "dovadaSpatiuTip", label: "Dovada dreptului de folosință a sediului", source: { from: "input", key: "dovadaSpatiuTip" }, required: true },
    { key: "codCaenPrincipal", label: "Cod CAEN activitate principală", source: { from: "input", key: "codCaenPrincipal" }, required: true },
    { key: "descriereCaenPrincipal", label: "Descrierea activității principale", source: { from: "input", key: "descriereCaenPrincipal" }, required: true },
    { key: "coduriCaenSecundare", label: "Coduri CAEN secundare", source: { from: "input", key: "coduriCaenSecundare" } },
    { key: "dataInceput", label: "Data începerii activității", source: { from: "input", key: "dataInceput" }, required: true, validate: "date" },
    { key: "optiuneTva", label: "Înregistrare în scopuri de TVA", source: { from: "input", key: "optiuneTva" } },
  ],
  inputs: [
    { key: "sediuLocalitate", label: "Sediu profesional — localitate", required: true },
    { key: "sediuStrada", label: "Sediu profesional — stradă", required: true },
    { key: "sediuNumar", label: "Sediu profesional — număr", required: true },
    { key: "sediuDetalii", label: "Sediu — bloc/scară/etaj/ap. (dacă e cazul)" },
    { key: "dovadaSpatiuTip", label: "Dovada dreptului de folosință (proprietate/închiriere/comodat)", required: true },
    { key: "codCaenPrincipal", label: "Cod CAEN activitate principală (4 cifre)", required: true },
    { key: "descriereCaenPrincipal", label: "Descrierea activității principale", required: true },
    { key: "coduriCaenSecundare", label: "Coduri CAEN secundare (separate prin virgulă)" },
    { key: "dataInceput", label: "Data începerii activității", required: true, validate: "date" },
    { key: "optiuneTva", label: "Solicit înregistrarea în scopuri de TVA" },
  ],
  channels: [onlineChannel, ghiseuChannel],
};

export const MENTIUNI_PFA_MANIFEST: FormManifest = {
  id: "MENTIUNI-PFA-national-2024",
  authority: "ONRC — Oficiul Registrului Comerțului",
  jurisdiction: "national",
  formCode: "MENTIUNI-PFA",
  revision: "2024",
  validFrom: "2024-01-01",
  sourceUrl: "https://www.onrc.ro/index.php/ro/mentiuni/persoane-fizice",
  sourceSha256: null,
  workflow: "generated",
  signature: "none",
  title: "Cerere de mențiuni PFA (schimbare/modificare/suspendare/reluare/radiere)",
  fields: [
    ...titular,
    { key: "denumirePfa", label: "Denumirea PFA înregistrată", source: { from: "input", key: "denumirePfa" }, required: true },
    { key: "nrOrdineRegistru", label: "Nr. de ordine în registrul comerțului", source: { from: "input", key: "nrOrdineRegistru" }, required: true },
    { key: "cui", label: "Cod unic de înregistrare (CUI)", source: { from: "input", key: "cui" }, required: true },
    { key: "orctJudet", label: "Județul ORCT", source: { from: "input", key: "orctJudet" }, required: true },
    { key: "tipMentiune", label: "Tipul mențiunii", source: { from: "input", key: "tipMentiune" }, required: true },
    { key: "noulSediu", label: "Schimbare sediu — noua adresă", source: { from: "input", key: "noulSediu" } },
    { key: "coduriCaenAdaugate", label: "CAEN — coduri de adăugat", source: { from: "input", key: "coduriCaenAdaugate" } },
    { key: "coduriCaenEliminate", label: "CAEN — coduri de eliminat", source: { from: "input", key: "coduriCaenEliminate" } },
    { key: "dataSuspendarePanaLa", label: "Suspendare — până la data", source: { from: "input", key: "dataSuspendarePanaLa" }, validate: "date" },
    { key: "dataReluare", label: "Reluare — data reluării", source: { from: "input", key: "dataReluare" }, validate: "date" },
    { key: "motivRadiere", label: "Radiere — motivul", source: { from: "input", key: "motivRadiere" } },
    { key: "modEliberare", label: "Modul de eliberare a documentelor", source: { from: "input", key: "modEliberare" }, required: true },
  ],
  inputs: [
    { key: "denumirePfa", label: "Denumirea PFA (ex. Popescu Ion PFA)", required: true },
    { key: "nrOrdineRegistru", label: "Nr. de ordine în registrul comerțului (ex. F40/1234/2020)", required: true },
    { key: "cui", label: "Cod unic de înregistrare (CUI)", required: true },
    { key: "orctJudet", label: "Județul ORCT", required: true },
    { key: "tipMentiune", label: "Tipul mențiunii", required: true },
    { key: "noulSediu", label: "Schimbare sediu: noua adresă completă" },
    { key: "coduriCaenAdaugate", label: "Modificare CAEN: coduri de adăugat" },
    { key: "coduriCaenEliminate", label: "Modificare CAEN: coduri de eliminat" },
    { key: "dataSuspendarePanaLa", label: "Suspendare: până la data (max. 3 ani)", validate: "date" },
    { key: "dataReluare", label: "Reluare: data reluării", validate: "date" },
    { key: "motivRadiere", label: "Radiere: motivul" },
    { key: "modEliberare", label: "Modul de eliberare", required: true },
  ],
  channels: [onlineChannel, ghiseuChannel],
};

export const PFA_EVENTS = ["INFIINTARE", "MENTIUNE"] as const;
export type PfaEvent = (typeof PFA_EVENTS)[number];

export const PFA_EVENT_FORMS: Record<PfaEvent, readonly string[]> = {
  INFIINTARE: ["REZERVARE-PFA", "INREGISTRARE-PFA"],
  MENTIUNE: ["MENTIUNI-PFA"],
};

// Validare la granița ciclului PFA. Enum-uri pe forme/operațiuni; dată pe
// început/suspendare/reluare; codul CAEN principal verificat ca 4 cifre.
export const PfaBodySchema = z.object({
  event: z.enum(PFA_EVENTS),
  // Rezervare denumire
  tipEntitate: optionalEnum(TIP_ENTITATE),
  denumirePropusa: z.string().max(200).optional(),
  denumireVarianta2: z.string().max(200).optional(),
  denumireVarianta3: z.string().max(200).optional(),
  judetSediu: z.string().max(60).optional(),
  // Înregistrare (județul vine din judetSediu, comun cu rezervarea)
  sediuLocalitate: z.string().max(120).optional(),
  sediuStrada: z.string().max(160).optional(),
  sediuNumar: z.string().max(30).optional(),
  sediuDetalii: z.string().max(120).optional(),
  dovadaSpatiuTip: optionalEnum(DOVADA_SPATIU),
  codCaenPrincipal: z
    .string()
    .max(6)
    .refine((v) => v === "" || /^\d{4}$/.test(v.trim()), "cod CAEN invalid (4 cifre)")
    .optional(),
  descriereCaenPrincipal: z.string().max(300).optional(),
  coduriCaenSecundare: z.string().max(300).optional(),
  dataInceput: optionalDateString,
  optiuneTva: optionalEnum(DA_NU),
  // Mențiuni
  denumirePfa: z.string().max(200).optional(),
  nrOrdineRegistru: z.string().max(40).optional(),
  cui: z.string().max(30).optional(),
  orctJudet: z.string().max(60).optional(),
  tipMentiune: optionalEnum(TIP_MENTIUNE),
  noulSediu: z.string().max(300).optional(),
  coduriCaenAdaugate: z.string().max(300).optional(),
  coduriCaenEliminate: z.string().max(300).optional(),
  dataSuspendarePanaLa: optionalDateString,
  dataReluare: optionalDateString,
  motivRadiere: optionalEnum(MOTIV_RADIERE),
  modEliberare: optionalEnum(MOD_ELIBERARE),
}).superRefine((v, ctx) => {
  // Mențiunea trebuie să conțină câmpul specific operației alese — altfel s-ar
  // genera o cerere validă dar goală de conținut (ex. radiere fără motiv).
  if (v.event !== "MENTIUNE") return;
  const require = (field: string, missing: boolean) => {
    if (missing) ctx.addIssue({ code: "custom", path: [field], message: "obligatoriu pentru mențiunea aleasă" });
  };
  switch (v.tipMentiune) {
    case "Schimbare sediu profesional":
      require("noulSediu", !v.noulSediu);
      break;
    case "Adăugare/modificare CAEN":
      require("coduriCaenAdaugate", !v.coduriCaenAdaugate && !v.coduriCaenEliminate);
      break;
    case "Suspendare activitate":
      require("dataSuspendarePanaLa", !v.dataSuspendarePanaLa);
      break;
    case "Reluare activitate":
      require("dataReluare", !v.dataReluare);
      break;
    case "Radiere":
      require("motivRadiere", !v.motivRadiere);
      break;
  }
});

export function registerPfa(): void {
  registerManifest(REZERVARE_PFA_MANIFEST);
  registerManifest(INREGISTRARE_PFA_MANIFEST);
  registerManifest(MENTIUNI_PFA_MANIFEST);
}
