import { z } from "zod";

// Validare la granița vehiculului (task 2.1). Câmpurile din SPEC; completare
// incrementală (OCR CIV la 2.2, corecții manuale). VIN = 17 caractere fără
// I/O/Q (standard ISO 3779).

const empty = (v: unknown) => v === "" || v === null || v === undefined;

export const COMBUSTIBIL = [
  "BENZINA",
  "MOTORINA",
  "HIBRID",
  "ELECTRIC",
  "GPL",
  "ALTUL",
] as const;

const optionalDate = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.date().optional(),
);

const posInt = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.number().int().positive().optional(),
);

export const VehiculInput = z.object({
  vin: z
    .string()
    .optional()
    .refine(
      (v) => empty(v) || /^[A-HJ-NPR-Z0-9]{17}$/i.test(v as string),
      "VIN invalid (17 caractere, fără I/O/Q)",
    ),
  marca: z.string().max(60).optional(),
  model: z.string().max(60).optional(),
  nrInmatriculare: z.string().max(20).optional(),
  civSerie: z.string().max(30).optional(),
  serieMotor: z.string().max(40).optional(),
  cilindreeCm3: posInt,
  masaMaximaKg: posInt,
  anFabricatie: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().int().min(1900).max(2100).optional(),
  ),
  // Un <select> cu „Alege..." trimite "" (nu undefined) → tratăm "" ca necompletat
  // înainte de enum, altfel un combustibil neales ar bloca salvarea (opțional).
  combustibil: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.enum(COMBUSTIBIL).optional(),
  ),
  normaPoluare: z.string().max(30).optional(),
  emisiiCo2GKm: posInt,
  putereKw: posInt,
  dataDobandire: optionalDate,
});

export type VehiculInput = z.infer<typeof VehiculInput>;
