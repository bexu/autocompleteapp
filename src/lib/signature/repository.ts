import { prisma } from "@/lib/db/prisma";
import { decryptField, encryptField } from "@/lib/crypto/field-encryption";
import type { SignResult } from "./provider";

// Arhivă de documente semnate: bytes-ii criptați (envelope, AAD=user) + hash de
// integritate + metadate semnătură. Acces cu verificare de proprietate.

function aad(userId: string): string {
  return `${userId}:signed`;
}

export interface SignedFormMeta {
  id: string;
  formCode: string;
  manifestId: string;
  provider: string;
  status: string;
  contentHash: string;
  signedAt: Date;
}

export async function archiveSignedForm(
  userId: string,
  input: { formCode: string; manifestId: string; result: SignResult },
): Promise<SignedFormMeta> {
  const contentEnc = encryptField(
    Buffer.from(input.result.signedPdf).toString("base64"),
    aad(userId),
  );
  const row = await prisma.signedForm.create({
    data: {
      userId,
      formCode: input.formCode,
      manifestId: input.manifestId,
      provider: input.result.provider,
      status: input.result.status,
      contentHash: input.result.contentHash,
      contentEnc,
      signedAt: input.result.signedAt,
    },
  });
  return toMeta(row);
}

export async function listSignedForms(userId: string): Promise<SignedFormMeta[]> {
  const rows = await prisma.signedForm.findMany({
    where: { userId },
    orderBy: { signedAt: "desc" },
  });
  return rows.map(toMeta);
}

export async function getSignedFormContent(
  userId: string,
  id: string,
): Promise<{ meta: SignedFormMeta; bytes: Buffer } | null> {
  const row = await prisma.signedForm.findUnique({ where: { id } });
  if (!row || row.userId !== userId) return null;
  const bytes = Buffer.from(decryptField(row.contentEnc, aad(userId)), "base64");
  return { meta: toMeta(row), bytes };
}

function toMeta(row: {
  id: string;
  formCode: string;
  manifestId: string;
  provider: string;
  status: string;
  contentHash: string;
  signedAt: Date;
}): SignedFormMeta {
  return {
    id: row.id,
    formCode: row.formCode,
    manifestId: row.manifestId,
    provider: row.provider,
    status: row.status,
    contentHash: row.contentHash,
    signedAt: row.signedAt,
  };
}
