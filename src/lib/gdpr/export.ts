import { prisma } from "@/lib/db/prisma";
import { getProfile, type DecryptedProfile } from "@/lib/profile/repository";
import { listDocuments, type DocumentMeta } from "@/lib/documents/repository";
import { getConsentStatus, type ConsentStatus } from "./consent";
import { audit } from "./audit";

// Dreptul de acces / portabilitate (art. 15 & 20): tot ce deținem despre user,
// într-un JSON. Profilul e decriptat (datele proprii ale userului); documentele
// includ doar metadate (bytes-ii se descarcă separat, din seif).

export interface UserDataExport {
  generatedAt: string;
  account: { email: string; name: string; createdAt: Date } | null;
  profile: DecryptedProfile | null;
  documents: DocumentMeta[];
  consents: ConsentStatus[];
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [account, profile, documents, consents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, createdAt: true },
    }),
    getProfile(userId),
    listDocuments(userId),
    getConsentStatus(userId),
  ]);

  await audit(userId, "DATA_EXPORT");

  return {
    generatedAt: new Date().toISOString(),
    account,
    profile,
    documents,
    consents,
  };
}
