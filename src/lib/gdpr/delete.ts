import { prisma } from "@/lib/db/prisma";
import { audit } from "./audit";

// Dreptul la ștergere (art. 17). Două nivele:
//  - `deleteUserData`: șterge datele personale (profil, adrese, documente,
//    consimțăminte), păstrează contul (userul poate reîncepe).
//  - `deleteAccount`: șterge complet contul (cascadă pe tot).
// Auditul rămâne (fără PII) ca dovadă că ștergerea a avut loc.

export async function deleteUserData(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.reminder.deleteMany({ where: { userId } }),
    prisma.dossier.deleteMany({ where: { userId } }),
    prisma.signedForm.deleteMany({ where: { userId } }),
    prisma.vehicul.deleteMany({ where: { userId } }),
    prisma.document.deleteMany({ where: { userId } }),
    prisma.profile.deleteMany({ where: { userId } }), // cascadă pe adrese
    prisma.consent.deleteMany({ where: { userId } }),
  ]);
  await audit(userId, "DATA_DELETE");
}

export async function deleteAccount(userId: string): Promise<void> {
  // Auditul se scrie ÎNAINTE de ștergere; userId e opac și supraviețuiește.
  await audit(userId, "ACCOUNT_DELETE");
  await prisma.user.delete({ where: { id: userId } }); // cascadă pe tot
}
