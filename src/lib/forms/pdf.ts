import { PDFDocument, type PDFFont, StandardFonts, rgb } from "pdf-lib";
import type { FormManifest } from "./manifest";
import type { MappedField } from "./mapping";

// Generare PDF (workflow "generated"): produce un document lizibil cu datele
// mapate, până la integrarea template-ului oficial (AcroForm fill / overlay),
// care va folosi ACELEAȘI valori mapate. Pur JS (pdf-lib), fără servicii externe.

const PAGE_W = 595; // A4
const PAGE_H = 842;
const MARGIN = 50;
const TOP = 800;
const USABLE_W = PAGE_W - 2 * MARGIN;

export async function generateFormPdf(
  manifest: FormManifest,
  fields: MappedField[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = TOP;

  // Scrie un bloc de text: împarte pe linii care încap în lățimea paginii
  // (respectă și `\n` din input, ex. corpul unei petiții) și trece pe pagină
  // nouă la depășire — nimic nu iese din pagină și nimic nu se pierde.
  const drawBlock = (text: string, size: number, useBold = false, gap = 10) => {
    const f = useBold ? bold : font;
    for (const line of wrapText(text, f, size)) {
      if (y < MARGIN + size) {
        page = doc.addPage([PAGE_W, PAGE_H]);
        y = TOP;
      }
      page.drawText(line, { x: MARGIN, y, size, font: f, color: rgb(0, 0, 0) });
      y -= size + 3;
    }
    y -= gap;
  };

  drawBlock(manifest.title, 14, true, 6);
  drawBlock(
    `${manifest.authority} - formular ${manifest.formCode} - rev. ${manifest.revision}`,
    9,
    false,
    16,
  );

  for (const f of fields) {
    drawBlock(`${f.label}:`, 11, true, 2);
    drawBlock(f.value || "-", 11, false, 10);
  }

  drawBlock("Verifici, semnezi si depui pe propria raspundere.", 8, false, 0);

  return doc.save();
}

// Împarte textul în linii care încap în `USABLE_W`. Păstrează liniile goale
// (paragrafe) din input; sparge inclusiv cuvintele mai late decât o pagină.
function wrapText(text: string, font: PDFFont, size: number): string[] {
  const lines: string[] = [];
  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const clean = sanitize(rawLine);
    if (clean === "") {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of clean.split(/\s+/).filter(Boolean)) {
      for (const chunk of splitLongWord(word, font, size)) {
        const candidate = current ? `${current} ${chunk}` : chunk;
        if (current && font.widthOfTextAtSize(candidate, size) > USABLE_W) {
          lines.push(current);
          current = chunk;
        } else {
          current = candidate;
        }
      }
    }
    lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}

// Un singur „cuvânt" mai lat decât pagina (text lipit fără spații) → bucăți.
function splitLongWord(word: string, font: PDFFont, size: number): string[] {
  if (font.widthOfTextAtSize(word, size) <= USABLE_W) return [word];
  const chunks: string[] = [];
  let cur = "";
  for (const ch of word) {
    if (cur && font.widthOfTextAtSize(cur + ch, size) > USABLE_W) {
      chunks.push(cur);
      cur = ch;
    } else {
      cur += ch;
    }
  }
  if (cur) chunks.push(cur);
  return chunks;
}

// StandardFonts (WinAnsi) nu acoperă tot Unicode — normalizăm pentru redare,
// fără a altera datele stocate. Fallback pe „?" ca pdf-lib să nu arunce.
const SUBSCRIPTS = "₀₁₂₃₄₅₆₇₈₉";

export function sanitize(s: string): string {
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
      .replace(/[^ -~ -ÿ]/g, "?")
  );
}
