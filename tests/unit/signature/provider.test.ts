import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { MockSignatureProvider } from "@/lib/signature/provider";

async function makePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  return doc.save();
}

describe("MockSignatureProvider", () => {
  it("semnează: produce PDF valid + hash sha256 stabil", async () => {
    const provider = new MockSignatureProvider();
    const pdf = await makePdf();
    const now = new Date("2026-05-01T10:00:00.000Z");

    const r = await provider.sign(pdf, { formCode: "230", signerLabel: "abc123" }, now);
    expect(r.provider).toBe("mock");
    expect(r.status).toBe("SIGNED");
    expect(r.signedAt).toEqual(now);
    expect(Buffer.from(r.signedPdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    expect(r.contentHash).toMatch(/^[0-9a-f]{64}$/);
    // hash-ul corespunde bytes-ilor semnați
    const { createHash } = await import("node:crypto");
    expect(createHash("sha256").update(r.signedPdf).digest("hex")).toBe(r.contentHash);
  });

  it("PDF-ul semnat e mai mare decât originalul (ștampilă adăugată)", async () => {
    const pdf = await makePdf();
    const r = await new MockSignatureProvider().sign(
      pdf,
      { formCode: "230", signerLabel: "x" },
      new Date("2026-05-01T10:00:00.000Z"),
    );
    expect(r.signedPdf.length).toBeGreaterThan(pdf.length);
  });
});
