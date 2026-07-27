import { z } from "zod";

// Evenimente de viață auto → setul corect de formulare + inputurile lor +
// checklist cross-instituție (taxe locale / DGPCI / RCA / plăcuțe). „Dosare
// pentru evenimente de viață": userul spune „am vândut mașina", nu „vreau ITL-016".

export const AUTO_EVENTS = ["VANZARE", "CUMPARARE"] as const;
export type AutoEvent = (typeof AUTO_EVENTS)[number];

export function isAutoEvent(v: string): v is AutoEvent {
  return (AUTO_EVENTS as readonly string[]).includes(v);
}

// Validare la granița wizardului auto (input extern → Zod, ca la Vehicul/Imobil).
export const AutoWizardSchema = z.object({
  event: z.enum(AUTO_EVENTS),
  vehicleId: z.string().min(1, "vehicul lipsă"),
  contrapartaNume: z.string().max(200).optional(),
  contrapartaCnp: z.string().max(20).optional(),
  pret: z.string().max(30).optional(),
  data: z.string().max(30).optional(),
});

export type AutoWizardInput = z.infer<typeof AutoWizardSchema>;

interface AutoFormRef {
  formCode: string;
  jurisdiction: string;
}

interface AutoEventDef {
  label: string;
  forms: AutoFormRef[];
  checklist: string[];
  buildInputs(input: AutoWizardInput, formCode: string): Record<string, unknown>;
}

const CLUJ = "cluj";
const NAT = "national";

export const AUTO_EVENT_DEFS: Record<AutoEvent, AutoEventDef> = {
  // Userul e VÂNZĂTOR: certificat fiscal → contract → scoatere din evidență.
  VANZARE: {
    label: "Am vândut mașina",
    forms: [
      { formCode: "ITL-010", jurisdiction: CLUJ },
      { formCode: "ITL-054", jurisdiction: NAT },
      { formCode: "ITL-016", jurisdiction: CLUJ },
    ],
    checklist: [
      "Obține certificatul de atestare fiscală (ITL-010) de la taxe locale",
      "Semnează contractul de înstrăinare-dobândire (ITL-054) cu cumpărătorul",
      "Depune scoaterea din evidența fiscală (ITL-016) la taxe locale, cu contractul",
      "Reziliază polița RCA/CASCO pentru vehiculul vândut",
      "Predă plăcuțele cumpărătorului sau solicită păstrarea numărului",
    ],
    buildInputs(input, formCode) {
      switch (formCode) {
        case "ITL-054":
          return {
            cumparatorNume: input.contrapartaNume,
            cumparatorCnp: input.contrapartaCnp,
            pret: input.pret,
            dataContract: input.data,
          };
        case "ITL-016":
          return { dobanditorNume: input.contrapartaNume, dataInstrainare: input.data };
        case "ITL-010":
          return { scop: "Înstrăinare vehicul" };
        default:
          return {};
      }
    },
  },

  // Userul e CUMPĂRĂTOR: declarare la taxe locale → transcriere DGPCI.
  // Contractul (ITL-054) îl primește de la vânzător — nu îl generăm noi.
  CUMPARARE: {
    label: "Am cumpărat o mașină",
    forms: [
      { formCode: "ITL-005", jurisdiction: CLUJ },
      { formCode: "DGPCI", jurisdiction: NAT },
    ],
    checklist: [
      "Declară vehiculul la taxe locale (ITL-005), cu contractul primit",
      "Transcrie certificatul de înmatriculare la DGPCI (cererea DGPCI)",
      "Încheie o poliță RCA pe numele tău înainte de a circula",
      "Verifică dacă păstrezi numărul vechi sau primești unul nou",
    ],
    buildInputs(input, formCode) {
      switch (formCode) {
        case "DGPCI":
          return { tipCerere: "Transcriere" };
        case "ITL-005":
          return {}; // datele vin din vehicul + profil
        default:
          return {};
      }
    },
  },
};
