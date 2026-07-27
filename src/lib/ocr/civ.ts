// Parser CIV (certificat de înmatriculare) pe codurile armonizate UE
// (Directiva 1999/37/CE). Determinist, on-device, ca și MRZ-ul. Nu inventăm
// coduri — sunt cele oficiale de pe certificat.
//
//   A   → nr. înmatriculare        E    → VIN (nr. identificare)
//   B   → data primei înmatriculări D.1 → marca
//   D.3 → model (denumire comercială)  P.1 → cilindree (cm³)
//   P.2 → putere (kW)              P.3  → combustibil
//   F.1 → masă maximă tehnic admisă  V.7 → emisii CO₂ (g/km)
//   V.9 → clasă emisii (normă Euro)

import { documentToText } from "./image";

export interface VehicleFields {
  vin: string | null;
  nrInmatriculare: string | null;
  marca: string | null;
  model: string | null;
  cilindreeCm3: number | null;
  putereKw: number | null;
  masaMaximaKg: number | null;
  combustibil: string | null;
  anFabricatie: number | null;
  normaPoluare: string | null;
  emisiiCo2GKm: number | null;
  source: "civ" | "none";
}

const EMPTY: VehicleFields = {
  vin: null,
  nrInmatriculare: null,
  marca: null,
  model: null,
  cilindreeCm3: null,
  putereKw: null,
  masaMaximaKg: null,
  combustibil: null,
  anFabricatie: null,
  normaPoluare: null,
  emisiiCo2GKm: null,
  source: "none",
};

function toInt(v: string): number | null {
  const n = parseInt(v.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
}

function mapFuel(v: string): string | null {
  const s = v.toUpperCase();
  const electric = /ELECTRIC|ELEKTR/.test(s);
  const fossil = /BENZIN|PETROL|GASOLINE|MOTORIN|DIESEL/.test(s);
  // Hibridul e prioritar: cuvântul „hibrid" SAU electric + fosil în același câmp.
  if (/HIBRID|HYBRID|PHEV/.test(s) || (electric && fossil)) return "HIBRID";
  if (electric) return "ELECTRIC";
  if (/BENZIN|PETROL|GASOLINE/.test(s)) return "BENZINA";
  if (/MOTORIN|DIESEL/.test(s)) return "MOTORINA";
  if (/\bGPL\b|LPG/.test(s)) return "GPL";
  return null;
}

function isPlausibleVin(vin: string | null): boolean {
  return !!vin && /^[A-HJ-NPR-Z0-9]{11,17}$/.test(vin);
}

/** Parsează textul unui CIV pe codurile UE. Întoarce câmpurile găsite. */
export function parseCivText(text: string): VehicleFields {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: VehicleFields = { ...EMPTY };
  const matched = new Set<string>();

  for (const line of lines) {
    // cod = literă + eventual „.cifră" la începutul liniei, urmat de separator
    const m = /^([A-Z](?:\.\d+)?)\s*[:.\-)]?\s+(.+)$/.exec(line);
    if (!m) continue;
    const code = m[1].toUpperCase();
    const value = m[2].trim();

    switch (code) {
      case "A":
        result.nrInmatriculare = value.replace(/\s+/g, " ");
        matched.add(code);
        break;
      case "E":
        result.vin = value.replace(/\s+/g, "").toUpperCase();
        matched.add(code);
        break;
      // Nota: B = data PRIMEI ÎNMATRICULĂRI, nu anul fabricației — pe CIV nu
      // există un cod armonizat pentru anul fabricației, deci nu îl deducem.
      case "D.1":
        result.marca = value;
        matched.add(code);
        break;
      case "D.3":
        result.model = value;
        matched.add(code);
        break;
      case "P.1":
        result.cilindreeCm3 = toInt(value);
        matched.add(code);
        break;
      case "P.2":
        result.putereKw = toInt(value);
        matched.add(code);
        break;
      case "P.3":
        result.combustibil = mapFuel(value);
        matched.add(code);
        break;
      case "F.1":
        result.masaMaximaKg = toInt(value);
        matched.add(code);
        break;
      case "V.7":
        result.emisiiCo2GKm = toInt(value);
        matched.add(code);
        break;
      case "V.9":
        result.normaPoluare = value;
        matched.add(code);
        break;
    }
  }

  // Codurile cu o literă (A/B/E) apar și în contracte/CI ca enumerări. Semnalul
  // tare e un cod cu punct (D.1, P.2, V.9 — nu apar în enumerări) SAU un VIN
  // plauzibil pe câmpul E. Fără el, nu declarăm textul drept CIV.
  const hasDottedCode = [...matched].some((c) => c.includes("."));
  const isCiv = hasDottedCode || isPlausibleVin(result.vin);
  result.source = isCiv ? "civ" : "none";
  return result;
}

export interface VehicleOcrProvider {
  extractVehicle(bytes: Buffer, mime?: string): Promise<VehicleFields>;
}

export class CivOcrProvider implements VehicleOcrProvider {
  async extractVehicle(bytes: Buffer, mime?: string): Promise<VehicleFields> {
    // Text (coduri CIV) direct, sau imagine → OCR on-device → text (ADR 0011).
    const text = await documentToText(bytes, mime);
    return parseCivText(text);
  }
}

export function getVehicleOcrProvider(): VehicleOcrProvider {
  return new CivOcrProvider();
}
