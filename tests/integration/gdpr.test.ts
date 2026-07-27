import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { saveDocument } from "@/lib/documents/repository";
import { signForm } from "@/lib/forms/engine";
import {
  getConsentStatus,
  grantConsent,
  hasConsent,
  withdrawConsent,
} from "@/lib/gdpr/consent";
import { exportUserData } from "@/lib/gdpr/export";
import { deleteAccount, deleteUserData } from "@/lib/gdpr/delete";

async function makeUser(): Promise<string> {
  const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
  const u = await prisma.user.create({
    data: { id: `gdpr_${s}`, name: "G", email: `gdpr_${s}@example.com` },
  });
  return u.id;
}

describe("GDPR (integration, DB reală)", () => {
  const created: string[] = [];

  beforeAll(() => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 5).toString("base64");
    }
    resetEnvCache();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("consimțământ: grant idempotent, withdraw, status + audit", async () => {
    const userId = await makeUser();
    created.push(userId);

    await grantConsent(userId, "IDENTITATE");
    await grantConsent(userId, "IDENTITATE"); // idempotent
    expect(await hasConsent(userId, "IDENTITATE")).toBe(true);

    const rows = await prisma.consent.count({ where: { userId, category: "IDENTITATE" } });
    expect(rows).toBe(1); // fără duplicat

    await withdrawConsent(userId, "IDENTITATE");
    expect(await hasConsent(userId, "IDENTITATE")).toBe(false);

    const status = await getConsentStatus(userId);
    expect(status.find((c) => c.category === "IDENTITATE")?.granted).toBe(false);

    const audits = await prisma.auditLog.findMany({ where: { userId } });
    expect(audits.map((a) => a.action)).toEqual(
      expect.arrayContaining(["CONSENT_GRANT", "CONSENT_WITHDRAW"]),
    );
    // Auditul nu conține PII — doar categoria.
    expect(audits.every((a) => !a.detail || a.detail === "IDENTITATE")).toBe(true);
  });

  it("export: adună TOATE categoriile (profil, documente, semnate, dosare, remindere, consimțăminte)", async () => {
    const userId = await makeUser();
    created.push(userId);
    await upsertProfile(userId, { nume: "Exportescu", prenume: "Ana", cnp: "1960101223143" });
    await saveDocument(userId, {
      tip: "CI",
      filename: "b.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("x"),
    });
    await grantConsent(userId, "IDENTITATE");
    // Semnează un 230 → creează SignedForm + Dossier.
    await signForm(userId, {
      formCode: "230",
      inputs: {
        beneficiarDenumire: "X",
        beneficiarCif: "1",
        beneficiarIban: "RO49AAAA1B31007593840000",
      },
    });

    const data = await exportUserData(userId);
    expect(data.profile?.nume).toBe("Exportescu");
    expect(data.profile?.cnp).toBe("1960101223143"); // decriptat pentru owner
    expect(data.documents).toHaveLength(1);
    expect(data.consents.find((c) => c.category === "IDENTITATE")?.granted).toBe(true);
    // Fără breșă de acces: semnate + dosare sunt incluse.
    expect(data.signedForms.length).toBeGreaterThanOrEqual(1);
    expect(data.dossiers.length).toBeGreaterThanOrEqual(1);
    expect(data.dossiers[0].formCode).toBe("230");
  });

  it("ștergere date: profil/documente/consimțăminte dispar, contul rămâne", async () => {
    const userId = await makeUser();
    created.push(userId);
    await upsertProfile(userId, { nume: "Stergescu", cnp: "1960101223143" });
    await saveDocument(userId, {
      tip: "CI",
      filename: "b.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("x"),
    });
    await grantConsent(userId, "IDENTITATE");

    await deleteUserData(userId);

    expect(await prisma.profile.count({ where: { userId } })).toBe(0);
    expect(await prisma.document.count({ where: { userId } })).toBe(0);
    expect(await prisma.consent.count({ where: { userId } })).toBe(0);
    expect(await prisma.user.count({ where: { id: userId } })).toBe(1); // contul rămâne
    // Auditul de ștergere există.
    expect(
      await prisma.auditLog.count({ where: { userId, action: "DATA_DELETE" } }),
    ).toBe(1);
  });

  it("ștergere cont: userul dispare, auditul supraviețuiește", async () => {
    const userId = await makeUser();
    await upsertProfile(userId, { nume: "Contescu" });

    await deleteAccount(userId);

    expect(await prisma.user.count({ where: { id: userId } })).toBe(0);
    // Auditul (fără FK) rămâne ca dovadă.
    expect(
      await prisma.auditLog.count({ where: { userId, action: "ACCOUNT_DELETE" } }),
    ).toBe(1);
    // curăță auditul rămas
    await prisma.auditLog.deleteMany({ where: { userId } });
  });
});
