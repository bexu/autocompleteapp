import { prisma } from "@/lib/db/prisma";

// Dosare: starea de depunere a unui formular. „generate, don't submit" — userul
// declară „depus"; noi nu depunem în locul lui.

export const DOSSIER_STATUS = ["DE_DEPUS", "DEPUS"] as const;
export type DossierStatus = (typeof DOSSIER_STATUS)[number];

export interface DossierMeta {
  id: string;
  formCode: string;
  manifestId: string;
  signedFormId: string | null;
  status: DossierStatus;
  submittedAt: Date | null;
  deadline: string | null;
  createdAt: Date;
}

export async function createDossier(
  userId: string,
  input: { formCode: string; manifestId: string; signedFormId?: string; deadline?: string | null },
): Promise<DossierMeta> {
  const row = await prisma.dossier.create({
    data: {
      userId,
      formCode: input.formCode,
      manifestId: input.manifestId,
      signedFormId: input.signedFormId ?? null,
      status: "DE_DEPUS",
      deadline: input.deadline ?? null,
    },
  });
  return toMeta(row);
}

export async function listDossiers(userId: string): Promise<DossierMeta[]> {
  const rows = await prisma.dossier.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toMeta);
}

export async function getDossier(userId: string, id: string): Promise<DossierMeta | null> {
  const row = await prisma.dossier.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  return toMeta(row);
}

/** Userul declară dosarul depus (nu depunem noi). */
export async function markSubmitted(
  userId: string,
  id: string,
  now: Date = new Date(),
): Promise<DossierMeta | null> {
  const row = await prisma.dossier.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  const updated = await prisma.dossier.update({
    where: { id },
    data: { status: "DEPUS", submittedAt: now },
  });
  return toMeta(updated);
}

function toMeta(row: {
  id: string;
  formCode: string;
  manifestId: string;
  signedFormId: string | null;
  status: string;
  submittedAt: Date | null;
  deadline: string | null;
  createdAt: Date;
}): DossierMeta {
  return {
    id: row.id,
    formCode: row.formCode,
    manifestId: row.manifestId,
    signedFormId: row.signedFormId,
    status: row.status as DossierStatus,
    submittedAt: row.submittedAt,
    deadline: row.deadline,
    createdAt: row.createdAt,
  };
}
