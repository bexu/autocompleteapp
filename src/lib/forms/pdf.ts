import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { FormManifest } from "./manifest";
import type { MappedField } from "./mapping";

// Generare PDF (workflow "generated"): produce un document lizibil cu datele
// mapate, până la integrarea template-ului oficial (AcroForm fill / overlay),
// care va folosi ACELEAȘI valori mapate. Pur JS (pdf-lib), fără servicii externe.

export async function generateFormPdf(
  manifest: FormManifest,
  fields: MappedField[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([595, 842]); // A4
  const margin = 50;
  let y = 800;

  const draw = (text: string, size: number, useBold = false) => {
    page.drawText(sanitize(text), {
      x: margin,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0, 0, 0),
    });
  };

  draw(manifest.title, 14, true);
  y -= 20;
  draw(`${manifest.authority} - formular ${manifest.formCode} - rev. ${manifest.revision}`, 9);
  y -= 30;

  for (const f of fields) {
    if (y < margin + 20) {
      y = 800;
      doc.addPage([595, 842]);
    }
    draw(`${f.label}:`, 11, true);
    y -= 14;
    draw(f.value || "-", 11);
    y -= 22;
  }

  y -= 10;
  draw("Verifici, semnezi și depui pe propria răspundere.", 8);

  return doc.save();
}

// pdf-lib StandardFonts (WinAnsi) nu acoperă toate diacriticele — normalizăm
// pentru redare, fără a altera datele stocate.
function sanitize(s: string): string {
  return s
    .replace(/[ăâ]/g, "a")
    .replace(/[ĂÂ]/g, "A")
    .replace(/î/g, "i")
    .replace(/Î/g, "I")
    .replace(/[șş]/g, "s")
    .replace(/[ȘŞ]/g, "S")
    .replace(/[țţ]/g, "t")
    .replace(/[ȚŢ]/g, "T");
}
