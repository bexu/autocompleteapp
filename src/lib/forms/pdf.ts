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

  const margin = 50;
  let page = doc.addPage([595, 842]); // A4
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
      // pagină nouă la overflow — reasignăm pagina activă (nu o pierdem)
      page = doc.addPage([595, 842]);
      y = 800;
    }
    draw(`${f.label}:`, 11, true);
    y -= 14;
    draw(f.value || "-", 11);
    y -= 22;
  }

  if (y < margin + 20) {
    page = doc.addPage([595, 842]);
    y = 800;
  }
  y -= 10;
  draw("Verifici, semnezi si depui pe propria raspundere.", 8);

  return doc.save();
}

// StandardFonts (WinAnsi) nu acoperă tot Unicode — normalizăm pentru redare,
// fără a altera datele stocate. Fallback pe „?" ca pdf-lib să nu arunce.
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";

function sanitize(s: string): string {
  return (
    s
      .replace(/[ăâ]/g, "a") // ă â
      .replace(/[ĂÂ]/g, "A")
      .replace(/î/g, "i") // î
      .replace(/Î/g, "I")
      .replace(/[șş]/g, "s") // ș ş
      .replace(/[ȘŞ]/g, "S")
      .replace(/[țţ]/g, "t") // ț ţ
      .replace(/[ȚŢ]/g, "T")
      // subscript (CO₂) — nu e în Latin-1
      .replace(/[₀-₉]/g, (c) => String(SUBSCRIPTS.indexOf(c)))
      // liniuțe/ghilimele tipografice → ASCII
      .replace(/[–—]/g, "-")
      .replace(/[„“”]/g, '"')
      .replace(/[‘’]/g, "'")
      // fallback: orice în afara ASCII-printabil + Latin-1 upper → "?"
      // (² ³ = U+00B2/B3 rămân, sunt în Latin-1).
      .replace(/[^ -~ -ÿ]/g, "?")
  );
}
