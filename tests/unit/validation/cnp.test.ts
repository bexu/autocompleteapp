import { describe, expect, it } from "vitest";
import { isValidCnp } from "@/lib/validation/cnp";

describe("isValidCnp", () => {
  // CNP-uri sintetice cu cifră de control corectă (calculate cu algoritmul oficial).
  it("acceptă CNP-uri valide", () => {
    expect(isValidCnp("1960101223143")).toBe(true);
    expect(isValidCnp("2980312051007")).toBe(true);
    expect(isValidCnp("5000101123457")).toBe(true);
  });

  it("respinge cifra de control greșită", () => {
    expect(isValidCnp("1960101223144")).toBe(false);
  });

  it("respinge lungimea/formatul greșit", () => {
    expect(isValidCnp("123")).toBe(false);
    expect(isValidCnp("196010122314X")).toBe(false);
    expect(isValidCnp("")).toBe(false);
  });

  it("respinge prima cifră 0 și luna invalidă", () => {
    expect(isValidCnp("0960101223140")).toBe(false);
    expect(isValidCnp("1961301223140")).toBe(false); // luna 13
  });
});
