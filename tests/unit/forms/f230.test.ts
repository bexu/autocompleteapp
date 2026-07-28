import { describe, expect, it } from "vitest";
import { F230BodySchema } from "@/lib/forms/f230";

describe("F230BodySchema — validare la graniță", () => {
  const ok = {
    beneficiarDenumire: "Asociația Exemplu",
    beneficiarCif: "12345678",
    beneficiarIban: "RO49AAAA1B31007593840000",
    doiAni: true,
  };

  it("acceptă un set valid", () => {
    expect(F230BodySchema.safeParse(ok).success).toBe(true);
  });

  it("acceptă CIF cu prefix RO", () => {
    expect(F230BodySchema.safeParse({ ...ok, beneficiarCif: "RO12345678" }).success).toBe(true);
  });

  it("respinge un CIF ne-numeric (nume tastat în câmpul greșit)", () => {
    expect(F230BodySchema.safeParse({ ...ok, beneficiarCif: "Asociatia X" }).success).toBe(false);
  });
});
