import { describe, expect, it } from "vitest";
import { parseCivText } from "@/lib/ocr/civ";

// CIV sintetic pe codurile UE (Directiva 1999/37/CE).
const CIV = [
  "A: CJ 12 ABC",
  "B: 15.03.2019",
  "D.1 BMW",
  "D.3 320d xDrive",
  "E: WBA3A5C50FF123456",
  "P.1 1995",
  "P.2 140",
  "P.3 Motorina",
  "F.1 1980",
  "V.7 120",
  "V.9 Euro 6",
].join("\n");

describe("parseCivText", () => {
  it("extrage câmpurile de pe codurile UE", () => {
    const v = parseCivText(CIV);
    expect(v.source).toBe("civ");
    expect(v.nrInmatriculare).toBe("CJ 12 ABC");
    expect(v.vin).toBe("WBA3A5C50FF123456");
    expect(v.marca).toBe("BMW");
    expect(v.model).toBe("320d xDrive");
    expect(v.cilindreeCm3).toBe(1995);
    expect(v.putereKw).toBe(140);
    expect(v.combustibil).toBe("MOTORINA");
    expect(v.masaMaximaKg).toBe(1980);
    expect(v.anFabricatie).toBeNull(); // B = data primei înmatriculări, nu anul fabricației
    expect(v.emisiiCo2GKm).toBe(120);
    expect(v.normaPoluare).toBe("Euro 6");
  });

  it("mapează combustibilii uzuali", () => {
    expect(parseCivText("P.3 Benzina").combustibil).toBe("BENZINA");
    expect(parseCivText("P.3 Electric").combustibil).toBe("ELECTRIC");
    expect(parseCivText("P.3 Hybrid").combustibil).toBe("HIBRID");
  });

  it("întoarce source none pentru text fără coduri", () => {
    expect(parseCivText("doar niște text").source).toBe("none");
  });

  it("NU confundă enumerările cu o literă (A/B/E) dintr-un contract cu un CIV", () => {
    const contract = ["A. Vânzătorul Ion", "B. Cumpărătorul Ana", "E. Observații diverse"].join("\n");
    expect(parseCivText(contract).source).toBe("none");
  });

  it("acceptă CIV pe baza unui cod cu punct (D.1) chiar fără VIN plauzibil", () => {
    expect(parseCivText("D.1 BMW\nD.3 320d").source).toBe("civ");
  });

  it("acceptă CIV pe baza unui VIN plauzibil pe E, fără coduri cu punct", () => {
    expect(parseCivText("A: CJ 12 ABC\nE: WBA3A5C50FF123456").source).toBe("civ");
  });

  it("clasifică hibridul corect chiar dacă P.3 numește și un combustibil fosil", () => {
    expect(parseCivText("D.1 Toyota\nP.3 Benzina/Electric (hibrid)").combustibil).toBe("HIBRID");
    expect(parseCivText("D.1 Toyota\nP.3 Benzina + Electric").combustibil).toBe("HIBRID");
  });

  it("NU pune data primei înmatriculări (B) în anul fabricației", () => {
    const v = parseCivText("D.1 BMW\nB: 15.03.2019");
    expect(v.anFabricatie).toBeNull();
  });
});
