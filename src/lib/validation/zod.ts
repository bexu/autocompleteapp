import { z } from "zod";
import { isValidDate } from "./date";

// Ajutoare Zod reutilizabile la granițele formularelor.

// Enum opțional venit dintr-un <select>: un „—"/„Alege..." trimite "" (nu
// undefined), deci tratăm "" ca „necompletat" înainte de validarea enum-ului.
export function optionalEnum<T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess((v) => (v === "" ? undefined : v), z.enum(values).optional());
}

// String de dată opțional: gol trece, altfel trebuie să fie o dată reală.
export const optionalDateString = z
  .string()
  .max(30)
  .refine((v) => v === "" || isValidDate(v), "dată invalidă")
  .optional();
