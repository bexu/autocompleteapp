import type { DecryptedProfile } from "@/lib/profile/repository";
import type { Vehicul } from "@/lib/vehicle/repository";
import type { Imobil } from "@/lib/imobil/repository";
import type { FormManifest } from "./manifest";
import { isValidCnp } from "@/lib/validation/cnp";
import { isValidIban } from "@/lib/validation/iban";

export interface FormSources {
  profile: DecryptedProfile | null;
  vehicle?: Vehicul | null;
  imobil?: Imobil | null;
}

// Mapare declarativă: manifest + profil + inputuri → valori de câmp + erori.
// Fără logică per-formular aici; totul vine din manifest.

export interface MappedField {
  key: string;
  label: string;
  value: string;
}

export interface FieldError {
  key: string;
  message: string;
}

export interface MapResult {
  fields: MappedField[];
  errors: FieldError[];
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc == null) return undefined;
    return (acc as Record<string, unknown>)[part];
  }, obj);
}

function toStr(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "boolean") return v ? "Da" : "Nu";
  return String(v);
}

export function mapForm(
  manifest: FormManifest,
  sources: FormSources,
  inputs: Record<string, unknown>,
): MapResult {
  const fields: MappedField[] = [];
  const errors: FieldError[] = [];

  for (const def of manifest.fields) {
    let raw: unknown;
    if (def.source.from === "profile") raw = getByPath(sources.profile, def.source.path);
    else if (def.source.from === "vehicle") raw = getByPath(sources.vehicle ?? null, def.source.path);
    else if (def.source.from === "imobil") raw = getByPath(sources.imobil ?? null, def.source.path);
    else if (def.source.from === "input") raw = inputs[def.source.key];
    else raw = def.source.value;

    // Trim: o valoare doar-spații e „lipsă", nu validă. Curăță și PDF-ul.
    const value = toStr(raw).trim();

    if (def.required && value === "") {
      errors.push({ key: def.key, message: `${def.label} e obligatoriu` });
    } else if (value !== "" && def.validate) {
      if (def.validate === "cnp" && !isValidCnp(value)) {
        errors.push({ key: def.key, message: `${def.label} invalid` });
      } else if (def.validate === "iban" && !isValidIban(value)) {
        errors.push({ key: def.key, message: `${def.label} invalid` });
      }
    }

    fields.push({ key: def.key, label: def.label, value });
  }

  return { fields, errors };
}
