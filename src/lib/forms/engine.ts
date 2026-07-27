import { getProfile } from "@/lib/profile/repository";
import { getVehicul } from "@/lib/vehicle/repository";
import { getSignatureProvider } from "@/lib/signature/provider";
import { archiveSignedForm } from "@/lib/signature/repository";
import { createDossier } from "@/lib/dispatch/repository";
import { computeNextDeadline } from "@/lib/reminders/deadline";
import { selectManifest, type FormManifest } from "./registered";
import { mapForm, type MapResult } from "./mapping";
import { generateFormPdf } from "./pdf";

// Motorul de formulare: selectează manifestul (cod + jurisdicție + dată),
// mapează profilul + inputurile, validează, generează PDF. Un formular nou =
// un manifest înregistrat, fără cod nou aici. Manifestele se auto-înregistrează
// prin importul din "./registered".

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
  vehicleId?: string; // pentru formularele auto (mapare din vehicul)
}

async function resolveAndMap(userId: string, opts: GenerateOptions) {
  const manifest = selectManifest(
    opts.formCode,
    opts.jurisdiction ?? "national",
    opts.at ?? new Date(),
  );
  if (!manifest) throw new ManifestNotFoundError();

  const [profile, vehicle] = await Promise.all([
    getProfile(userId),
    opts.vehicleId ? getVehicul(userId, opts.vehicleId) : Promise.resolve(null),
  ]);
  const mapped = mapForm(manifest, { profile, vehicle }, opts.inputs ?? {});
  if (mapped.errors.length > 0) throw new FormValidationError(mapped.errors);
  return { manifest, fields: mapped.fields };
}

/** Preview „exact ce semnezi": doar valorile mapate, fără PDF. */
export async function previewForm(
  userId: string,
  opts: GenerateOptions,
): Promise<{ manifest: FormManifest; fields: MapResult["fields"] }> {
  return resolveAndMap(userId, opts);
}

export async function generateForm(
  userId: string,
  opts: GenerateOptions,
): Promise<GenerateResult> {
  const { manifest, fields } = await resolveAndMap(userId, opts);
  const pdf = await generateFormPdf(manifest, fields);
  return { manifest, fields, pdf };
}

export interface SignResultMeta {
  signedFormId: string;
  dossierId: string;
  signedPdf: Uint8Array;
  contentHash: string;
  manifest: FormManifest;
}

/**
 * Generează, semnează (provider mock/QTSP), arhivează criptat și deschide un
 * dosar „de depus" (dispatch + handoff). „generate, don't submit".
 */
export async function signForm(
  userId: string,
  opts: GenerateOptions,
  now: Date = new Date(),
): Promise<SignResultMeta> {
  const { manifest, pdf } = await generateForm(userId, opts);
  const provider = getSignatureProvider();
  const result = await provider.sign(
    pdf,
    { formCode: manifest.formCode, signerLabel: userId.slice(0, 8) },
    now,
  );
  const meta = await archiveSignedForm(userId, {
    formCode: manifest.formCode,
    manifestId: manifest.id,
    result,
  });
  const deadlineAt = manifest.deadlineRule
    ? computeNextDeadline(manifest.deadlineRule, now)
    : null;
  const dossier = await createDossier(userId, {
    formCode: manifest.formCode,
    manifestId: manifest.id,
    signedFormId: meta.id,
    deadline: manifest.deadline ?? null,
    deadlineAt,
  });
  return {
    signedFormId: meta.id,
    dossierId: dossier.id,
    signedPdf: result.signedPdf,
    contentHash: result.contentHash,
    manifest,
  };
}
