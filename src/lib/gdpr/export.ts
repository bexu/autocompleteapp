import { prisma } from "@/lib/db/prisma";
import { getProfile, type DecryptedProfile } from "@/lib/profile/repository";
import { listDocuments, type DocumentMeta } from "@/lib/documents/repository";
import { listSignedForms, type SignedFormMeta } from "@/lib/signature/repository";
import { listDossiers, type DossierMeta } from "@/lib/dispatch/repository";
import { getConsentStatus, type ConsentStatus } from "./consent";
import { audit } from "./audit";

// Dreptul de acces / portabilitate (art. 15 & 20): TOT ce deținem despre user.
// Setul trebuie să acopere aceleași categorii pe care le șterge deleteUserData —
// altfel apare o breșă de acces (date pe care le avem dar nu le arătăm).

export interface ReminderExport {
  formCode: string;
  kind: string;
  deadlineAt: Date;
}

export interface UserDataExport {
  generatedAt: string;
  account: { email: string; name: string; createdAt: Date } | null;
  profile: DecryptedProfile | null;
  documents: DocumentMeta[];
  signedForms: SignedFormMeta[];
  dossiers: DossierMeta[];
  reminders: ReminderExport[];
  consents: ConsentStatus[];
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [account, profile, documents, signedForms, dossiers, reminderRows, consents] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, createdAt: true },
      }),
      getProfile(userId),
      listDocuments(userId),
      listSignedForms(userId),
      listDossiers(userId),
      prisma.reminder.findMany({ where: { userId } }),
      getConsentStatus(userId),
    ]);

  await audit(userId, "DATA_EXPORT");

  return {
    generatedAt: new Date().toISOString(),
    account,
    profile,
    documents,
    signedForms,
    dossiers,
    reminders: reminderRows.map((r) => ({
      formCode: r.formCode,
      kind: r.kind,
      deadlineAt: r.deadlineAt,
    })),
    consents,
  };
}
