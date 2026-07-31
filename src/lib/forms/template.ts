import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { MappedField } from "./mapping";
import { sanitize } from "./pdf";

// Completarea TIPIZATELOR OFICIALE. Un formular nou = DATE (fișierul oficial +
// o hartă de câmpuri), fără cod nou în motor — indiferent de domeniu.
//
// Două moduri, ca să acopere orice document:
//   - `acroform`: PDF cu câmpuri completabile → completăm după nume (fidelitate
//     maximă, rezistent la mici reașezări de pagină).
//   - `overlay`: ORICE PDF plat (scan, export din Word) → desenăm valorile la
//     coordonate. Universal — funcționează pe orice tipizat.
//
// Integritate (guardrail „nu inventa surse"): fișierul se verifică prin SHA-256
// față de valoarea din definiție. Dacă hash-ul nu se potrivește, NU completăm —
// altfel am produce un document oficial pornind de la o sursă necunoscută.

export interface FieldPlacement {
  /** cheia câmpului mapat (manifest.fields[].key) */
  key: string;
  /** pagina (0-based) */
  page: number;
  /** coordonate PDF: originea e colțul STÂNGA-JOS al paginii */
  x: number;
  y: number;
  size?: number;
  /** lățime maximă; peste ea textul se taie (tipizatele au căsuțe fixe) */
  maxWidth?: number;
}

export interface FormTemplate {
  /** id-ul manifestului pe care îl deservește (FormManifest.id) */
  manifestId: string;
  /** cale relativă la directorul de template-uri */
  file: string;
  /** SHA-256 al fișierului oficial — verificat la fiecare încărcare */
  sha256: string;
  mode: "acroform" | "overlay";
  /** acroform: cheia noastră → numele câmpului din PDF */
  fieldMap?: Record<string, string>;
  /** overlay: unde se scrie fiecare câmp */
  placements?: FieldPlacement[];
  /** aplatizează formularul după completare (implicit true la acroform) */
  flatten?: boolean;
}

export class TemplateIntegrityError extends Error {
  constructor(manifestId: string) {
    super(`Tipizatul pentru ${manifestId} nu corespunde hash-ului declarat`);
    this.name = "TemplateIntegrityError";
  }
}

export class TemplateFieldError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Câmpuri inexistente în tipizat: ${missing.join(", ")}`);
    this.name = "TemplateFieldError";
  }
}

const registry = new Map<string, FormTemplate>();

export function registerTemplate(t: FormTemplate): void {
  registry.set(t.manifestId, t);
}

export function getTemplate(manifestId: string): FormTemplate | null {
  return registry.get(manifestId) ?? null;
}

export function allTemplates(): FormTemplate[] {
  return [...registry.values()];
}

/** Doar pentru teste. */
export function _clearTemplates(): void {
  registry.clear();
}

export function templatesDir(): string {
  return process.env.TEMPLATES_DIR ?? path.join(process.cwd(), "templates");
}

export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Citește tipizatul și verifică integritatea (hash) înainte de folosire. */
export async function loadTemplateBytes(t: FormTemplate): Promise<Uint8Array> {
  const bytes = new Uint8Array(await readFile(path.join(templatesDir(), t.file)));
  if (sha256(bytes) !== t.sha256) throw new TemplateIntegrityError(t.manifestId);
  return bytes;
}

/**
 * Completează tipizatul oficial cu valorile mapate și întoarce PDF-ul.
 * Valorile se sanitizează (WinAnsi) ca la generarea proprie.
 */
export async function fillTemplate(
  t: FormTemplate,
  fields: MappedField[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(await loadTemplateBytes(t));
  const byKey = new Map(fields.map((f) => [f.key, sanitize(f.value)]));

  if (t.mode === "acroform") {
    const form = doc.getForm();
    const missing: string[] = [];
    for (const [key, pdfName] of Object.entries(t.fieldMap ?? {})) {
      const value = byKey.get(key);
      if (value === undefined) continue; // câmp nemapat pentru acest formular
      try {
        form.getTextField(pdfName).setText(value);
      } catch {
        missing.push(pdfName);
      }
    }
    // Un nume greșit de câmp înseamnă tipizat/hartă desincronizate → nu tăcem.
    if (missing.length > 0) throw new TemplateFieldError(missing);
    if (t.flatten !== false) form.flatten();
    return doc.save();
  }

  // overlay — funcționează pe ORICE PDF plat
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  for (const p of t.placements ?? []) {
    const value = byKey.get(p.key);
    if (!value) continue;
    const page = pages[p.page];
    if (!page) continue; // pagina nu există în tipizat → ignorăm, nu stricăm PDF-ul
    const size = p.size ?? 10;
    let text = value;
    if (p.maxWidth) {
      // căsuțele tipizatelor au lățime fixă — tăiem cu „…" în loc să scriem peste
      while (text.length > 1 && font.widthOfTextAtSize(text, size) > p.maxWidth) {
        text = text.slice(0, -1);
      }
      // „..." în ASCII — sigur codabil în WinAnsi, ca restul textului sanitizat
      if (text !== value && text.length > 3) text = text.slice(0, -3) + "...";
    }
    page.drawText(text, { x: p.x, y: p.y, size, font, color: rgb(0, 0, 0) });
  }
  return doc.save();
}
