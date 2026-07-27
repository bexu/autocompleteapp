import { z } from "zod";
import { isValidCnp } from "@/lib/validation/cnp";
import { isValidIban, normalizeIban } from "@/lib/validation/iban";

// Validare la granița profilului (task 1.2). Toate câmpurile sunt opționale —
// profilul se completează incremental (onboarding, OCR, corecții manuale).

const empty = (v: unknown) => v === "" || v === null || v === undefined;

const AddressInput = z.object({
  tip: z.enum(["DOMICILIU", "RESEDINTA"]),
  strada: z.string().max(200).optional(),
  nr: z.string().max(50).optional(),
  localitate: z.string().max(120).optional(),
  uat: z.string().max(120).optional(),
  judet: z.string().max(120).optional(),
  codPostal: z.string().max(20).optional(),
});

export const ProfileInput = z.object({
  nume: z.string().max(120).optional(),
  prenume: z.string().max(120).optional(),
  sex: z.enum(["M", "F"]).optional(),
  dataNasterii: z.coerce.date().optional(),

  cnp: z
    .string()
    .optional()
    .refine((v) => empty(v) || isValidCnp(v as string), "CNP invalid"),
  ciSerie: z.string().max(10).optional(),
  ciNr: z.string().max(20).optional(),
  ciEmitent: z.string().max(120).optional(),
  ciExp: z.coerce.date().optional(),

  telefon: z.string().max(30).optional(),
  iban: z
    .string()
    .optional()
    .refine((v) => empty(v) || isValidIban(v as string), "IBAN invalid")
    .transform((v) => (empty(v) ? v : normalizeIban(v as string))),

  addresses: z.array(AddressInput).max(5).optional(),
});

export type ProfileInput = z.infer<typeof ProfileInput>;
export type AddressInput = z.infer<typeof AddressInput>;
