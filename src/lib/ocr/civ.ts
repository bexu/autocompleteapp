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
  if (/BENZIN|PETROL|GASOLINE/.test(s)) return "BENZINA";
  if (/MOTORIN|DIESEL|MOTORINA/.test(s)) return "MOTORINA";
  if (/HIBRID|HYBRID/.test(s)) return "HIBRID";
  if (/ELECTRIC|ELEKTR/.test(s)) return "ELECTRIC";
  if (/\bGPL\b|LPG/.test(s)) return "GPL";
  return null;
}

function extractYear(v: string): number | null {
  const m = /\b(19|20)\d{2}\b/.exec(v);
  return m ? Number(m[0]) : null;
}

/** Parsează textul unui CIV pe codurile UE. Întoarce câmpurile găsite. */
export function parseCivText(text: string): VehicleFields {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: VehicleFields = { ...EMPTY };
  let found = false;

  for (const line of lines) {
    // cod = literă + eventual „.cifră" la începutul liniei, urmat de separator
    const m = /^([A-Z](?:\.\d+)?)\s*[:.\-)]?\s+(.+)$/.exec(line);
    if (!m) continue;
    const code = m[1].toUpperCase();
    const value = m[2].trim();

    switch (code) {
      case "A":
        result.nrInmatriculare = value.replace(/\s+/g, " ");
        found = true;
        break;
      case "E":
        result.vin = value.replace(/\s+/g, "").toUpperCase();
        found = true;
        break;
      case "B":
        result.anFabricatie = extractYear(value);
        found = true;
        break;
      case "D.1":
        result.marca = value;
        found = true;
        break;
      case "D.3":
        result.model = value;
        found = true;
        break;
      case "P.1":
        result.cilindreeCm3 = toInt(value);
        found = true;
        break;
      case "P.2":
        result.putereKw = toInt(value);
        found = true;
        break;
      case "P.3":
        result.combustibil = mapFuel(value);
        found = true;
        break;
      case "F.1":
        result.masaMaximaKg = toInt(value);
        found = true;
        break;
      case "V.7":
        result.emisiiCo2GKm = toInt(value);
        found = true;
        break;
      case "V.9":
        result.normaPoluare = value;
        found = true;
        break;
    }
  }

  result.source = found ? "civ" : "none";
  return result;
}

export interface VehicleOcrProvider {
  extractVehicle(bytes: Buffer, mime: string): Promise<VehicleFields>;
}

export class CivOcrProvider implements VehicleOcrProvider {
  async extractVehicle(bytes: Buffer): Promise<VehicleFields> {
    return parseCivText(bytes.toString("utf8"));
  }
}

export function getVehicleOcrProvider(): VehicleOcrProvider {
  // OCR pe imagine (foto CIV → text) se adaugă aici, în spatele aceleiași
  // interfețe, când integrarea reală e decisă (ADR 0007).
  return new CivOcrProvider();
}
