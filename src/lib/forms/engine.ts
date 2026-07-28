import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { getProfile } from "@/lib/profile/repository";
import { getVehicul } from "@/lib/vehicle/repository";
import { getImobil } from "@/lib/imobil/repository";
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
  vehicleId?: string; // formularele auto (mapare din vehicul)
  imobilId?: string; // formularele imobil (C168, mapare din imobil)
}

async function resolveAndMap(userId: string, opts: GenerateOptions) {
  const manifest = selectManifest(
    opts.formCode,
    opts.jurisdiction ?? "national",
    opts.at ?? new Date(),
  );
  if (!manifest) throw new ManifestNotFoundError();

  const [profile, vehicle, imobil] = await Promise.all([
    getProfile(userId),
    opts.vehicleId ? getVehicul(userId, opts.vehicleId) : Promise.resolve(null),
    opts.imobilId ? getImobil(userId, opts.imobilId) : Promise.resolve(null),
  ]);
  const mapped = mapForm(manifest, { profile, vehicle, imobil }, opts.inputs ?? {});
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
  const deadlineAt = manifest.deadlineRule
    ? computeNextDeadline(manifest.deadlineRule, now)
    : null;
  // Arhivare + dosar într-o singură tranzacție (fără dosar orfan la eșec).
  const { meta, dossier } = await prisma.$transaction(async (tx) => {
    const m = await archiveSignedForm(
      userId,
      { formCode: manifest.formCode, manifestId: manifest.id, result },
      tx,
    );
    const d = await createDossier(
      userId,
      {
        formCode: manifest.formCode,
        manifestId: manifest.id,
        signedFormId: m.id,
        deadline: manifest.deadline ?? null,
        deadlineAt,
      },
      tx,
    );
    return { meta: m, dossier: d };
  });
  return {
    signedFormId: meta.id,
    dossierId: dossier.id,
    signedPdf: result.signedPdf,
    contentHash: result.contentHash,
    manifest,
  };
}

export interface FiledFormMeta {
  dossierId: string;
  formCode: string;
  manifest: FormManifest;
  pdf: Uint8Array;
}

/**
 * Generează, arhivează (fără semnătură — formularele ITL se semnează olograf)
 * și deschide un dosar „de depus". Folosit de dosarul auto.
 */
export async function generateAndFileForm(
  userId: string,
  opts: GenerateOptions,
  now: Date = new Date(),
): Promise<FiledFormMeta> {
  const [filed] = await generateAndFileForms(userId, [opts], now);
  return filed;
}

/**
 * Generează + arhivează + deschide dosare pentru un SET de formulare, ATOMIC:
 * întâi generează și validează TOATE PDF-urile (fără scriere în DB — dacă un
 * formular e invalid, aruncă înainte de orice persistare), apoi scrie tot
 * într-o singură tranzacție (totul sau nimic — niciun dosar orfan la eșec).
 * Înlocuiește tiparul „faza 1 preview + faza 2 loop" din serviciile multi-formular.
 */
export async function generateAndFileForms(
  userId: string,
  optsList: GenerateOptions[],
  now: Date = new Date(),
): Promise<FiledFormMeta[]> {
  // Faza 1 — generează + validează toate PDF-urile (CPU, în afara tranzacției).
  const prepared: {
    manifest: FormManifest;
    pdf: Uint8Array;
    contentHash: string;
    deadlineAt: Date | null;
  }[] = [];
  for (const opts of optsList) {
    const { manifest, pdf } = await generateForm(userId, opts);
    prepared.push({
      manifest,
      pdf,
      contentHash: createHash("sha256").update(pdf).digest("hex"),
      deadlineAt: manifest.deadlineRule ? computeNextDeadline(manifest.deadlineRule, now) : null,
    });
  }

  // Faza 2 — persistă totul într-o singură tranzacție.
  return prisma.$transaction(async (tx) => {
    const out: FiledFormMeta[] = [];
    for (const p of prepared) {
      const meta = await archiveSignedForm(
        userId,
        {
          formCode: p.manifest.formCode,
          manifestId: p.manifest.id,
          result: { signedPdf: p.pdf, provider: "none", status: "GENERATED", signedAt: now, contentHash: p.contentHash },
        },
        tx,
      );
      const dossier = await createDossier(
        userId,
        {
          formCode: p.manifest.formCode,
          manifestId: p.manifest.id,
          signedFormId: meta.id,
          deadline: p.manifest.deadline ?? null,
          deadlineAt: p.deadlineAt,
        },
        tx,
      );
      out.push({ dossierId: dossier.id, formCode: p.manifest.formCode, manifest: p.manifest, pdf: p.pdf });
    }
    return out;
  });
}
