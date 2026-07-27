import Tesseract from "tesseract.js";

// OCR pe imagine, ON-DEVICE (Tesseract/WASM). Imaginea NU pleacă la terți —
// doar modelul lingvistic (eng.traineddata) se descarcă o dată. Vezi ADR 0011.
// Folosit pentru poze/scanuri de CI și CIV; textul rezultat e apoi parsat de
// parserele deterministe (MRZ / coduri CIV).

/** Detectează dacă bytes-ii sunt o imagine (PNG/JPEG) sau PDF, nu text. */
export function looksLikeImage(bytes: Buffer, mime?: string): boolean {
  if (mime && mime.startsWith("image/")) return true;
  if (bytes.length < 4) return false;
  // PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e) return true;
  // JPEG
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;
  return false;
}

/** Extrage text dintr-o imagine cu Tesseract. */
export async function imageToText(bytes: Buffer): Promise<string> {
  const { data } = await Tesseract.recognize(bytes, "eng");
  return data.text;
}

/**
 * Întoarce textul unui document: OCR dacă e imagine, altfel decodează utf8.
 * Astfel parserele (MRZ/CIV) primesc mereu text, indiferent de format.
 */
export async function documentToText(bytes: Buffer, mime?: string): Promise<string> {
  if (looksLikeImage(bytes, mime)) return imageToText(bytes);
  return bytes.toString("utf8");
}
