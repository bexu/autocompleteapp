import { prisma } from "@/lib/db/prisma";
import { decryptField, encryptField } from "@/lib/crypto/field-encryption";

// Seif de documente: bytes-ii scanurilor se stochează CRIPTAT (envelope, AAD
// legat de user) cu retenție definită. Conținutul se accesează doar de aici,
// mereu cu verificare de proprietate (userId).

export const DOCUMENT_TYPES = ["CI", "CIV", "CONTRACT", "ALTUL"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Limită de mărime pentru scanuri (bytes). 8 MB — suficient pentru CI/CIV.
export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

// Retenție implicită: scanurile se șterg după utilizare. 30 zile e fereastra
// în care userul finalizează un dosar; ajustabil per apel.
export const DEFAULT_RETENTION_DAYS = 30;

function aad(userId: string): string {
  return `${userId}:document`;
}

export interface DocumentMeta {
  id: string;
  tip: DocumentType;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  retainUntil: Date;
  createdAt: Date;
}

export interface SaveDocumentInput {
  tip: DocumentType;
  filename: string;
  mimeType: string;
  bytes: Buffer;
  retentionDays?: number;
  now?: Date; // injectabil pentru teste
}

export async function saveDocument(
  userId: string,
  input: SaveDocumentInput,
): Promise<DocumentMeta> {
  if (input.bytes.length === 0) throw new Error("Fișier gol.");
  if (input.bytes.length > MAX_DOCUMENT_BYTES) {
    throw new Error("Fișier prea mare.");
  }

  const now = input.now ?? new Date();
  const days = input.retentionDays ?? DEFAULT_RETENTION_DAYS;
  const retainUntil = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const contentEnc = encryptField(input.bytes.toString("base64"), aad(userId));

  const doc = await prisma.document.create({
    data: {
      userId,
      tip: input.tip,
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.bytes.length,
      contentEnc,
      retainUntil,
    },
  });

  return toMeta(doc);
}

export async function listDocuments(userId: string): Promise<DocumentMeta[]> {
  const docs = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return docs.map(toMeta);
}

/** Descarcă bytes-ii unui document — doar dacă aparține utilizatorului. */
export async function getDocumentContent(
  userId: string,
  id: string,
): Promise<{ meta: DocumentMeta; bytes: Buffer } | null> {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.userId !== userId) return null; // fără leak de existență
  const base64 = decryptField(doc.contentEnc, aad(userId));
  return { meta: toMeta(doc), bytes: Buffer.from(base64, "base64") };
}

export async function deleteDocument(userId: string, id: string): Promise<boolean> {
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc || doc.userId !== userId) return false;
  await prisma.document.delete({ where: { id } });
  return true;
}

/**
 * Șterge documentele cu retenția expirată. Apelabil manual; se va programa
 * ca job pg-boss la task 1.8. Întoarce numărul de documente șterse.
 */
export async function purgeExpiredDocuments(now: Date = new Date()): Promise<number> {
  const res = await prisma.document.deleteMany({
    where: { retainUntil: { lt: now } },
  });
  return res.count;
}

function toMeta(doc: {
  id: string;
  tip: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  retainUntil: Date;
  createdAt: Date;
}): DocumentMeta {
  return {
    id: doc.id,
    tip: doc.tip as DocumentType,
    filename: doc.filename,
    mimeType: doc.mimeType,
    sizeBytes: doc.sizeBytes,
    retainUntil: doc.retainUntil,
    createdAt: doc.createdAt,
  };
}
