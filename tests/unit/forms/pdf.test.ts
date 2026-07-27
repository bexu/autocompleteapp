import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
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

  it("gestionează text lung, multi-paragraf (petiție) fără a arunca", async () => {
    // Corp de petiție lung, cu paragrafe și un token fără spații mai lat decât
    // pagina — nu trebuie să iasă din pagină și nici să arunce.
    const longBody =
      "Reclamația mea privește un produs defect. ".repeat(200) +
      "\n\nDetalii suplimentare:\n" +
      "x".repeat(2000);
    const pdf = await generateFormPdf(F230_MANIFEST, [
      { key: "continut", label: "Conținut", value: longBody },
    ]);
    expect(Buffer.from(pdf.slice(0, 5)).toString("latin1")).toBe("%PDF-");
    // Textul se întinde pe mai multe pagini (nu e trunchiat pe una singură).
    const reloaded = await PDFDocument.load(pdf);
    expect(reloaded.getPageCount()).toBeGreaterThan(1);
  });
});
