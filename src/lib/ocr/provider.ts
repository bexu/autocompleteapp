import { isValidCnp, parseCnp } from "@/lib/validation/cnp";
import { parseTd1Mrz } from "./mrz";
import { documentToText } from "./image";

// Abstracție OCR pentru documente de identitate. Acceptă fișier TEXT cu MRZ SAU
// o IMAGINE (poză/scan CI) — imaginea trece prin OCR on-device (Tesseract),
// apoi textul e parsat. Robust la zgomotul de OCR: dacă MRZ-ul nu e citit
// perfect, cade pe scanarea directă a textului după un CNP valid. Vezi ADR 0011.

export interface IdCardFields {
  nume: string | null;
  prenume: string | null;
  cnp: string | null;
  ciSerie: string | null;
  ciNr: string | null;
  sex: "M" | "F" | null;
  dataNasterii: string | null; // ISO (YYYY-MM-DD)
  ciExp: string | null; // ISO
  source: "mrz" | "ocr" | "none";
}

export interface OcrProvider {
  extractIdCard(bytes: Buffer, mime?: string): Promise<IdCardFields>;
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

// Caută într-un șir de cifre o secvență de 13 care trece checksum-ul CNP.
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

// Nume/prenume după etichete (fața CI). OCR-ul poate strica diacriticele, dar
// prinde numele scrise cu majuscule.
function findLabeled(text: string, label: string): string | null {
  const re = new RegExp(`\\b${label}\\b\\s*[:.]?\\s*([A-ZĂÂÎȘȚ][A-ZĂÂÎȘȚ'\\- ]{1,40})`, "i");
  const m = re.exec(text);
  return m ? m[1].trim().replace(/\s{2,}/g, " ") : null;
}

// Serie+nr CI dintr-un text liber (OCR). Formatul românesc e etichetat
// („SERIA TR NR 123456"), deci NR e etichetă, nu serie — o preferăm pe cea de
// după „SERIA". Fallback: compact „XX123456" (dar nu eticheta NR).
function findSerieNr(text: string): { serie: string | null; nr: string | null } {
  const up = text.toUpperCase();
  const serie =
    /\bSERIA?\s*[:.]?\s*([A-Z]{2})\b/.exec(up)?.[1] ??
    /\b(?!NR\b)([A-Z]{2})\s*\d{6}\b/.exec(up)?.[1] ??
    null;
  const nr =
    /\bNR\.?\s*[:.]?\s*(\d{6})\b/.exec(up)?.[1] ??
    /\b[A-Z]{2}\s*(\d{6})\b/.exec(up)?.[1] ??
    null;
  return { serie, nr };
}

/**
 * Extrage câmpurile de identitate dintr-un text (MRZ curat SAU text OCR zgomotos).
 * 1) încearcă MRZ TD1; 2) completează/înlocuiește din scanarea directă a textului
 * după un CNP valid (checksum) — robust când OCR-ul strică o linie MRZ.
 */
export function extractIdentityFromText(text: string): IdCardFields {
  const mrz = parseTd1Mrz(text);
  const allDigits = text.replace(/\D/g, "");

  const cnp = (mrz && findCnp(mrz.optionalData)) ?? findCnp(allDigits);
  if (!cnp && !mrz) return EMPTY;

  const info = cnp ? parseCnp(cnp) : null;
  const docSplit = splitDocNumber(mrz?.documentNumber ?? null);
  const serieNr =
    docSplit.serie && docSplit.nr ? docSplit : findSerieNr(text);

  return {
    // Nume din MRZ (autoritativ) sau, dacă lipsește, din eticheta „Nume".
    nume: mrz?.surname ?? findLabeled(text, "NUME"),
    prenume: mrz?.givenNames ?? findLabeled(text, "PRENUME"),
    cnp,
    ciSerie: serieNr.serie,
    ciNr: serieNr.nr,
    sex: info?.sex ?? mrz?.sex ?? null,
    dataNasterii: isoDate(info?.birthDate ?? null),
    ciExp: isoDate(mrz?.expiry ?? null),
    source: mrz?.valid ? "mrz" : cnp ? "ocr" : "none",
  };
}

/** Provider CI: acceptă text (MRZ) sau imagine (poză/scan → OCR). */
export class MrzOcrProvider implements OcrProvider {
  async extractIdCard(bytes: Buffer, mime?: string): Promise<IdCardFields> {
    const text = await documentToText(bytes, mime);
    return extractIdentityFromText(text);
  }
}

export function getOcrProvider(): OcrProvider {
  return new MrzOcrProvider();
}
