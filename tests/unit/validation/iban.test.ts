import { describe, expect, it } from "vitest";
import { isValidIban, normalizeIban } from "@/lib/validation/iban";

describe("isValidIban", () => {
  it("acceptă IBAN RO valid, cu și fără spații", () => {
    expect(isValidIban("RO49AAAA1B31007593840000")).toBe(true);
    expect(isValidIban("RO49 AAAA 1B31 0075 9384 0000")).toBe(true);
    expect(isValidIban("RO09BCYP0000001234567890")).toBe(true);
  });

  it("acceptă IBAN non-RO valid (mod-97)", () => {
    expect(isValidIban("GB82WEST12345698765432")).toBe(true);
  });

  it("respinge cifra de control greșită", () => {
    expect(isValidIban("RO49AAAA1B31007593840001")).toBe(false);
  });

  it("respinge lungimea RO greșită", () => {
    expect(isValidIban("RO49AAAA1B3100759384")).toBe(false); // prea scurt pentru RO
  });

  it("respinge formatul invalid", () => {
    expect(isValidIban("")).toBe(false);
    expect(isValidIban("49AAAA1B31007593840000")).toBe(false);
    expect(isValidIban("RO4!AAAA1B31007593840000")).toBe(false);
  });

  it("normalizează spațiile și majusculele", () => {
    expect(normalizeIban("ro49 aaaa 1b31")).toBe("RO49AAAA1B31");
  });
});
