import { prisma } from "@/lib/db/prisma";
import { getProfile, type DecryptedProfile } from "@/lib/profile/repository";
import {
  getDocumentContent,
  listDocuments,
  type DocumentMeta,
} from "@/lib/documents/repository";
import {
  getSignedFormContent,
  listSignedForms,
  type SignedFormMeta,
} from "@/lib/signature/repository";
import { listDossiers, type DossierMeta } from "@/lib/dispatch/repository";
import { listVehicule, type Vehicul } from "@/lib/vehicle/repository";
import { listImobile, type Imobil } from "@/lib/imobil/repository";
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

// Metadate + conținutul efectiv (base64). Formularele generate și scanurile sunt
// deseori SINGURA copie a unor date personale (ex. CNP-ul copilului dintr-un PDF
// de alocație, corpul unei petiții) — accesul (art. 15) trebuie să le includă.
export interface SignedFormExport extends SignedFormMeta {
  contentBase64: string | null;
}

export interface DocumentExport extends DocumentMeta {
  contentBase64: string | null;
}

export interface UserDataExport {
  generatedAt: string;
  account: { email: string; name: string; createdAt: Date } | null;
  profile: DecryptedProfile | null;
  vehicule: Vehicul[];
  imobile: Imobil[];
  documents: DocumentExport[];
  signedForms: SignedFormExport[];
  dossiers: DossierMeta[];
  reminders: ReminderExport[];
  consents: ConsentStatus[];
}

export async function exportUserData(userId: string): Promise<UserDataExport> {
  const [account, profile, vehicule, imobile, documents, signedForms, dossiers, reminderRows, consents] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true, createdAt: true },
      }),
      getProfile(userId),
      listVehicule(userId),
      listImobile(userId),
      listDocuments(userId),
      listSignedForms(userId),
      listDossiers(userId),
      prisma.reminder.findMany({ where: { userId } }),
      getConsentStatus(userId),
    ]);

  // Atașează conținutul efectiv (decriptat) pentru scanuri și formulare semnate.
  const [documentsFull, signedFormsFull] = await Promise.all([
    Promise.all(
      documents.map(async (m) => {
        const c = await getDocumentContent(userId, m.id);
        return { ...m, contentBase64: c ? c.bytes.toString("base64") : null };
      }),
    ),
    Promise.all(
      signedForms.map(async (m) => {
        const c = await getSignedFormContent(userId, m.id);
        return { ...m, contentBase64: c ? c.bytes.toString("base64") : null };
      }),
    ),
  ]);

  await audit(userId, "DATA_EXPORT");

  return {
    generatedAt: new Date().toISOString(),
    account,
    profile,
    vehicule,
    imobile,
    documents: documentsFull,
    signedForms: signedFormsFull,
    dossiers,
    reminders: reminderRows.map((r) => ({
      formCode: r.formCode,
      kind: r.kind,
      deadlineAt: r.deadlineAt,
    })),
    consents,
  };
}
