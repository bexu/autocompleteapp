import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import {
  _clearTemplates,
  fillTemplate,
  getTemplate,
  registerTemplate,
  sha256,
  TemplateFieldError,
  TemplateIntegrityError,
  type FormTemplate,
} from "@/lib/forms/template";
import type { MappedField } from "@/lib/forms/mapping";

// Construim „tipizate oficiale" sintetice (un PDF cu câmpuri AcroForm și unul
// plat), ca să testăm completarea fără a depinde de fișiere externe.
async function makeAcroPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const form = doc.getForm();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const nume = form.createTextField("nume_solicitant");
  nume.addToPage(page, { x: 100, y: 700, width: 300, height: 20, font });
  const cnp = form.createTextField("cnp_solicitant");
  cnp.addToPage(page, { x: 100, y: 660, width: 300, height: 20, font });
  return doc.save();
}

async function makeFlatPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  return doc.save();
}

let dir: string;
const fields: MappedField[] = [
  { key: "nume", label: "Nume", value: "Ștefan Țăndărei" },
  { key: "cnp", label: "CNP", value: "1960101223143" },
];

async function writeTemplate(name: string, bytes: Uint8Array): Promise<string> {
  await writeFile(path.join(dir, name), bytes);
  return sha256(bytes);
}

describe("tipizate oficiale (template engine)", () => {
  beforeEach(async () => {
    _clearTemplates();
    if (!dir) {
      dir = await mkdtemp(path.join(tmpdir(), "tpl-"));
      process.env.TEMPLATES_DIR = dir;
    }
  });

  afterAll(async () => {
    delete process.env.TEMPLATES_DIR;
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("completează un tipizat cu câmpuri AcroForm după nume", async () => {
    const hash = await writeTemplate("acro.pdf", await makeAcroPdf());
    const t: FormTemplate = {
      manifestId: "X-1", file: "acro.pdf", sha256: hash, mode: "acroform",
      fieldMap: { nume: "nume_solicitant", cnp: "cnp_solicitant" },
    };
    registerTemplate(t);
    expect(getTemplate("X-1")).toBe(t);

    const out = await fillTemplate(t, fields);
    expect(Buffer.from(out.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
    // aplatizat implicit → câmpurile nu mai există ca formular editabil
    const reloaded = await PDFDocument.load(out);
    expect(reloaded.getForm().getFields()).toHaveLength(0);
  });

  it("overlay: scrie pe ORICE PDF plat, la coordonate", async () => {
    const hash = await writeTemplate("flat.pdf", await makeFlatPdf());
    const t: FormTemplate = {
      manifestId: "X-2", file: "flat.pdf", sha256: hash, mode: "overlay",
      placements: [
        { key: "nume", page: 0, x: 100, y: 700, size: 11 },
        { key: "cnp", page: 0, x: 100, y: 680, size: 11 },
      ],
    };
    const out = await fillTemplate(t, fields);
    expect(Buffer.from(out.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
    // documentul completat e mai mare decât originalul gol
    expect(out.length).toBeGreaterThan((await makeFlatPdf()).length);
  });

  it("REFUZĂ completarea dacă fișierul nu corespunde hash-ului (integritate)", async () => {
    await writeTemplate("flat2.pdf", await makeFlatPdf());
    const t: FormTemplate = {
      manifestId: "X-3", file: "flat2.pdf", sha256: "0".repeat(64), mode: "overlay",
      placements: [{ key: "nume", page: 0, x: 10, y: 10 }],
    };
    await expect(fillTemplate(t, fields)).rejects.toBeInstanceOf(TemplateIntegrityError);
  });

  it("semnalează un nume de câmp inexistent în tipizat (hartă desincronizată)", async () => {
    const hash = await writeTemplate("acro2.pdf", await makeAcroPdf());
    const t: FormTemplate = {
      manifestId: "X-4", file: "acro2.pdf", sha256: hash, mode: "acroform",
      fieldMap: { nume: "camp_care_nu_exista" },
    };
    await expect(fillTemplate(t, fields)).rejects.toBeInstanceOf(TemplateFieldError);
  });

  it("overlay: taie textul la lățimea căsuței, nu scrie peste", async () => {
    const hash = await writeTemplate("flat3.pdf", await makeFlatPdf());
    const t: FormTemplate = {
      manifestId: "X-5", file: "flat3.pdf", sha256: hash, mode: "overlay",
      placements: [{ key: "nume", page: 0, x: 100, y: 700, size: 11, maxWidth: 40 }],
    };
    const long: MappedField[] = [{ key: "nume", label: "N", value: "Un nume foarte foarte lung" }];
    await expect(fillTemplate(t, long)).resolves.toBeInstanceOf(Uint8Array);
  });

  it("ignoră o pagină inexistentă în loc să strice documentul", async () => {
    const hash = await writeTemplate("flat4.pdf", await makeFlatPdf());
    const t: FormTemplate = {
      manifestId: "X-6", file: "flat4.pdf", sha256: hash, mode: "overlay",
      placements: [{ key: "nume", page: 7, x: 10, y: 10 }],
    };
    const out = await fillTemplate(t, fields);
    expect(Buffer.from(out.subarray(0, 5)).toString("latin1")).toBe("%PDF-");
  });
});
