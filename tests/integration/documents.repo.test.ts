import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  deleteDocument,
  getDocumentContent,
  listDocuments,
  purgeExpiredDocuments,
  saveDocument,
} from "@/lib/documents/repository";
import { resetEnvCache } from "@/lib/config/env";

describe("document vault (integration, DB reală)", () => {
  let userId: string;
  let otherUserId: string;

  beforeAll(async () => {
    if (!process.env.ENCRYPTION_MASTER_KEY) {
      process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 4).toString("base64");
    }
    resetEnvCache();
    const s = `${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const u = await prisma.user.create({
      data: { id: `doc_${s}`, name: "D", email: `doc_${s}@example.com` },
    });
    const o = await prisma.user.create({
      data: { id: `oth_${s}`, name: "O", email: `oth_${s}@example.com` },
    });
    userId = u.id;
    otherUserId = o.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    await prisma.$disconnect();
  });

  it("stochează bytes CRIPTAT (nu în clar) și îi recuperează identic", async () => {
    const secret = "SECRET_SCAN_BYTES_1920707123456";
    const bytes = Buffer.from(secret, "utf8");
    const meta = await saveDocument(userId, {
      tip: "CI",
      filename: "buletin.txt",
      mimeType: "text/plain",
      bytes,
    });

    const raw = await prisma.document.findUnique({ where: { id: meta.id } });
    expect(raw?.contentEnc).toBeTruthy();
    expect(raw?.contentEnc).not.toContain(secret);
    expect(raw?.contentEnc).not.toContain(bytes.toString("base64"));
    expect(raw?.contentEnc?.startsWith("v1:")).toBe(true);

    const fetched = await getDocumentContent(userId, meta.id);
    expect(fetched?.bytes.equals(bytes)).toBe(true);
  });

  it("nu permite accesul la documentul altui user", async () => {
    const meta = await saveDocument(userId, {
      tip: "CI",
      filename: "x.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("abc"),
    });
    expect(await getDocumentContent(otherUserId, meta.id)).toBeNull();
    expect(await deleteDocument(otherUserId, meta.id)).toBe(false);
  });

  it("purjează documentele cu retenția expirată, dar le păstrează pe cele valide", async () => {
    const past = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
    const expired = await saveDocument(userId, {
      tip: "CI",
      filename: "vechi.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("vechi"),
      retentionDays: 1,
      now: past, // retainUntil = past + 1 zi → deja expirat
    });
    const valid = await saveDocument(userId, {
      tip: "CI",
      filename: "nou.txt",
      mimeType: "text/plain",
      bytes: Buffer.from("nou"),
      retentionDays: 30, // valid
    });

    const purged = await purgeExpiredDocuments(new Date());
    expect(purged).toBeGreaterThanOrEqual(1);

    const ids = (await listDocuments(userId)).map((d) => d.id);
    expect(ids).not.toContain(expired.id); // expirat → șters
    expect(ids).toContain(valid.id); // valid → păstrat
  });

  it("respinge fișier prea mare și fișier gol", async () => {
    await expect(
      saveDocument(userId, {
        tip: "CI",
        filename: "gol.txt",
        mimeType: "text/plain",
        bytes: Buffer.alloc(0),
      }),
    ).rejects.toThrow();
  });
});
