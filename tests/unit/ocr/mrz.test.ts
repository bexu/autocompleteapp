import { describe, expect, it } from "vitest";
import { computeCheckDigit, parseTd1Mrz } from "@/lib/ocr/mrz";
import { MrzOcrProvider, extractIdentityFromText } from "@/lib/ocr/provider";

// MRZ TD1 valid (CI românesc sintetic) cu CNP 1960101223143 și check-digits
// corecte — generat cu algoritmul standard.
const MRZ = [
  "IDROUTR123456<51960101223143<<",
  "9601019M3001019ROU<<<<<<<<<<<7",
  "IONESCU<<ANA<MARIA<<<<<<<<<<<<",
].join("\n");

describe("MRZ TD1", () => {
  it("verifică check-digit-ul standard", () => {
    expect(computeCheckDigit("TR123456<")).toBe(5);
    expect(computeCheckDigit("960101")).toBe(9);
    expect(computeCheckDigit("300101")).toBe(9);
  });

  it("parsează câmpurile și marchează valid", () => {
    const r = parseTd1Mrz(MRZ);
    expect(r?.valid).toBe(true);
    expect(r?.documentNumber).toBe("TR123456");
    expect(r?.nationality).toBe("ROU");
    expect(r?.sex).toBe("M");
    expect(r?.surname).toBe("IONESCU");
    expect(r?.givenNames).toBe("ANA MARIA");
    expect(r?.optionalData).toContain("1960101223143");
    expect(r?.expiry?.toISOString().slice(0, 10)).toBe("2030-01-01");
  });

  it("întoarce null pentru text fără MRZ", () => {
    expect(parseTd1Mrz("doar niște text oarecare")).toBeNull();
  });

  it("detectează check-digit greșit", () => {
    const bad = MRZ.replace("IDROUTR123456<5", "IDROUTR123456<0");
    expect(parseTd1Mrz(bad)?.valid).toBe(false);
  });
});

describe("MrzOcrProvider", () => {
  it("extrage câmpurile de identitate, cu CNP + sex + dată din CNP", async () => {
    const fields = await new MrzOcrProvider().extractIdCard(Buffer.from(MRZ, "utf8"));
    expect(fields.source).toBe("mrz");
    expect(fields.cnp).toBe("1960101223143");
    expect(fields.ciSerie).toBe("TR");
    expect(fields.ciNr).toBe("123456");
    expect(fields.nume).toBe("IONESCU");
    expect(fields.prenume).toBe("ANA MARIA");
    expect(fields.sex).toBe("M");
    expect(fields.dataNasterii).toBe("1996-01-01");
    expect(fields.ciExp).toBe("2030-01-01");
  });

  it("întoarce câmpuri goale (source none) pentru conținut fără MRZ", async () => {
    const fields = await new MrzOcrProvider().extractIdCard(Buffer.from("poză fără MRZ"));
    expect(fields.source).toBe("none");
    expect(fields.cnp).toBeNull();
  });
});

describe("extractIdentityFromText (robust la zgomot OCR)", () => {
  it("recuperează CNP + serie/nr din text OCR chiar dacă MRZ e stricat", () => {
    // Simulează OCR de pe fața CI: MRZ incomplet, dar CNP + serie/nr lizibile.
    const ocr = [
      "ROMANIA CARTE DE IDENTITATE",
      "Nume IONESCU",
      "Prenume ANA MARIA",
      "CNP 1960101223143",
      "Seria TR nr 123456",
      "IDROUTR123456<51960101223143<<",
    ].join("\n");
    const f = extractIdentityFromText(ocr);
    expect(f.cnp).toBe("1960101223143");
    expect(f.ciSerie).toBe("TR");
    expect(f.ciNr).toBe("123456");
    expect(f.nume).toBe("IONESCU"); // din eticheta „Nume"
    expect(f.prenume).toBe("ANA MARIA"); // din eticheta „Prenume"
    expect(f.sex).toBe("M"); // din CNP
    expect(f.dataNasterii).toBe("1996-01-01"); // din CNP
    expect(["mrz", "ocr"]).toContain(f.source);
  });

  it("source none dacă nu găsește niciun CNP valid", () => {
    expect(extractIdentityFromText("text fără date").source).toBe("none");
  });

  it("ignoră un CNP cu checksum greșit din zgomot", () => {
    expect(extractIdentityFromText("cod 1111111111111 aici").cnp).toBeNull();
  });
});
