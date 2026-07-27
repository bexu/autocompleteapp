import { isValidCnp, parseCnp } from "@/lib/validation/cnp";
import { parseTd1Mrz } from "./mrz";

// Abstracție OCR pentru documente de identitate. În v1 rulează calea MRZ
// (deterministă, standard). OCR pe imagine (foto → text) e o integrare
// ulterioară, în spatele aceleiași interfețe — vezi docs/adr/0007-ocr.md.

export interface IdCardFields {
  nume: string | null;
  prenume: string | null;
  cnp: string | null;
  ciSerie: string | null;
  ciNr: string | null;
  sex: "M" | "F" | null;
  dataNasterii: string | null; // ISO (YYYY-MM-DD)
  ciExp: string | null; // ISO
  source: "mrz" | "none";
}

export interface OcrProvider {
  extractIdCard(bytes: Buffer, mime: string): Promise<IdCardFields>;
}

const EMPTY: IdCardFields = {
  nume: null,
  prenume: null,
  cnp: null,
  ciSerie: null,
  ciNr: null,
  sex: null,
  dataNasterii: null,
  ciExp: null,
  source: "none",
};

function isoDate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

// Caută în șirul de cifre din câmpurile opționale o secvență de 13 cifre care
// trece checksum-ul CNP.
function findCnp(digits: string): string | null {
  for (let i = 0; i + 13 <= digits.length; i++) {
    const candidate = digits.slice(i, i + 13);
    if (isValidCnp(candidate)) return candidate;
  }
  return null;
}

// Nr. document RO = serie (litere) + număr (cifre), ex. „TR123456".
function splitDocNumber(doc: string | null): { serie: string | null; nr: string | null } {
  if (!doc) return { serie: null, nr: null };
  const m = /^([A-Z]+)(\d+)$/.exec(doc);
  if (!m) return { serie: null, nr: doc };
  return { serie: m[1], nr: m[2] };
}

/** Provider care extrage câmpurile din MRZ-ul (TD1) al unui CI. */
export class MrzOcrProvider implements OcrProvider {
  async extractIdCard(bytes: Buffer): Promise<IdCardFields> {
    const text = bytes.toString("utf8");
    const mrz = parseTd1Mrz(text);
    if (!mrz) return EMPTY;

    const cnp = findCnp(mrz.optionalData);
    const info = cnp ? parseCnp(cnp) : null;
    const { serie, nr } = splitDocNumber(mrz.documentNumber);

    return {
      nume: mrz.surname,
      prenume: mrz.givenNames,
      cnp,
      ciSerie: serie,
      ciNr: nr,
      // Sexul și data nașterii din CNP (autoritativ) dacă e prezent, altfel MRZ.
      sex: info?.sex ?? mrz.sex,
      dataNasterii: isoDate(info?.birthDate ?? null),
      ciExp: isoDate(mrz.expiry),
      source: "mrz",
    };
  }
}

export function getOcrProvider(): OcrProvider {
  // Un singur provider în v1. OCR pe imagine se adaugă aici, în spatele
  // aceleiași interfețe, când integrarea reală e decisă (ADR 0007).
  return new MrzOcrProvider();
}
