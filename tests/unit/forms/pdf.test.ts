import { describe, expect, it } from "vitest";
import { generateFormPdf } from "@/lib/forms/pdf";
import { F230_MANIFEST } from "@/lib/forms/f230";

describe("generateFormPdf", () => {
  it("produce un PDF valid, ne-gol", async () => {
    const pdf = await generateFormPdf(F230_MANIFEST, [
      { key: "nume", label: "Nume", value: "Ionescu" },
      { key: "cnp", label: "CNP", value: "1960101223143" },
      { key: "localitate", label: "Localitate", value: "Cluj-Napoca" },
    ]);
    expect(Buffer.from(pdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(500);
  });

  it("nu aruncă pe diacritice (sanitizare)", async () => {
    const pdf = await generateFormPdf(F230_MANIFEST, [
      { key: "nume", label: "Nume", value: "Ștefan Țăndărei" },
    ]);
    expect(pdf.length).toBeGreaterThan(500);
  });
});
