import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { resetEnvCache } from "@/lib/config/env";
import { upsertProfile } from "@/lib/profile/repository";
import { signForm } from "@/lib/forms/engine";
import {
  getSignedFormContent,
  listSignedForms,
} from "@/lib/signature/repository";

describe("semnare + arhivare 230 (integration, DB reală)", () => {
  let userId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 8).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const u = await prisma.user.create({
      data: { id: `sig_${s}`, name: "S", email: `sig_${s}@example.com` },
    });
    userId = u.id;
    await upsertProfile(userId, {
      nume: "Ionescu",
      prenume: "Ana",
      cnp: "1960101223143",
    });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it("semnează, arhivează criptat și recuperează cu hash valid", async () => {
    const { signedFormId, contentHash, signedPdf } = await signForm(userId, {
      formCode: "230",
      inputs: {
        beneficiarDenumire: "Asociația X",
        beneficiarCif: "12345678",
        beneficiarIban: "RO49AAAA1B31007593840000",
      },
    });

    // Arhiva conține documentul, criptat (nu în clar).
    const raw = await prisma.signedForm.findUnique({ where: { id: signedFormId } });
    expect(raw?.contentHash).toBe(contentHash);
    expect(raw?.contentEnc.startsWith("v1:")).toBe(true);
    expect(raw?.provider).toBe("mock");

    // Recuperare cu verificare de proprietate + integritate.
    const fetched = await getSignedFormContent(userId, signedFormId);
    expect(fetched?.bytes.equals(Buffer.from(signedPdf))).toBe(true);
    expect(createHash("sha256").update(fetched!.bytes).digest("hex")).toBe(contentHash);

    // Apare în listă.
    const list = await listSignedForms(userId);
    expect(list.some((f) => f.id === signedFormId && f.formCode === "230")).toBe(true);
  });

  it("nu permite accesul la documentul semnat al altui user", async () => {
    const { signedFormId } = await signForm(userId, {
      formCode: "230",
      inputs: {
        beneficiarDenumire: "Y",
        beneficiarCif: "1",
        beneficiarIban: "RO49AAAA1B31007593840000",
      },
    });
    expect(await getSignedFormContent("alt-user", signedFormId)).toBeNull();
  });
});
