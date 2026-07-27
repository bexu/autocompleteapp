import { getProfile } from "@/lib/profile/repository";
import { selectManifest, type FormManifest } from "./manifest";
import { mapForm, type MapResult } from "./mapping";
import { generateFormPdf } from "./pdf";
import { registerF230 } from "./f230";

// Motorul de formulare: selectează manifestul (cod + jurisdicție + dată),
// mapează profilul + inputurile, validează, generează PDF. Un formular nou =
// un manifest înregistrat, fără cod nou aici.

// Înregistrează manifestele disponibile (idempotent).
registerF230();

export class FormValidationError extends Error {
  constructor(public readonly errors: MapResult["errors"]) {
    super("Date invalide pentru formular");
    this.name = "FormValidationError";
  }
}

export class ManifestNotFoundError extends Error {
  constructor() {
    super("Niciun formular valid pentru codul/jurisdicția/data cerute");
    this.name = "ManifestNotFoundError";
  }
}

export interface GenerateResult {
  manifest: FormManifest;
  fields: MapResult["fields"];
  pdf: Uint8Array;
}

export interface GenerateOptions {
  formCode: string;
  jurisdiction?: string;
  at?: Date;
  inputs?: Record<string, unknown>;
}

export async function generateForm(
  userId: string,
  opts: GenerateOptions,
): Promise<GenerateResult> {
  const manifest = selectManifest(
    opts.formCode,
    opts.jurisdiction ?? "national",
    opts.at ?? new Date(),
  );
  if (!manifest) throw new ManifestNotFoundError();

  const profile = await getProfile(userId);
  const mapped = mapForm(manifest, profile, opts.inputs ?? {});
  if (mapped.errors.length > 0) throw new FormValidationError(mapped.errors);

  const pdf = await generateFormPdf(manifest, mapped.fields);
  return { manifest, fields: mapped.fields, pdf };
}
