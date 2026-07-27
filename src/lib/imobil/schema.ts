import { z } from "zod";

// Validare la granița imobilului (task 3.1). Proprietatea pentru C168; termenii
// de închiriere vin la C168, nu aici.

const posInt = z.preprocess(
  (v) => (v === "" || v === null ? undefined : v),
  z.coerce.number().int().positive().optional(),
);

export const TIP_IMOBIL = [
  "APARTAMENT",
  "CASA",
  "TEREN",
  "SPATIU_COMERCIAL",
  "ALTUL",
] as const;

export const ImobilInput = z.object({
  tip: z.enum(TIP_IMOBIL),
  judet: z.string().max(120).optional(),
  localitate: z.string().max(120).optional(),
  strada: z.string().max(200).optional(),
  nr: z.string().max(50).optional(),
  bloc: z.string().max(50).optional(),
  scara: z.string().max(30).optional(),
  etaj: z.string().max(30).optional(),
  apartament: z.string().max(30).optional(),
  codPostal: z.string().max(20).optional(),
  suprafataMp: posInt,
  nrCadastral: z.string().max(60).optional(),
  nrCarteFunciara: z.string().max(60).optional(),
});

export type ImobilInput = z.infer<typeof ImobilInput>;
