import { describe, expect, it } from "vitest";
import { VehiculInput } from "@/lib/vehicle/schema";

describe("VehiculInput — validare la graniță", () => {
  it("acceptă combustibil necompletat dintr-un <select> (\"\" → necompletat)", () => {
    // Regresie: un <select> cu „Alege..." trimite "", nu undefined. Combustibilul
    // e opțional → nu trebuie să blocheze salvarea vehiculului.
    const r = VehiculInput.safeParse({ marca: "Dacia", model: "Logan", combustibil: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.combustibil).toBeUndefined();
  });

  it("acceptă un combustibil valid din enum", () => {
    const r = VehiculInput.safeParse({ marca: "Dacia", combustibil: "MOTORINA" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.combustibil).toBe("MOTORINA");
  });

  it("respinge un combustibil în afara enum-ului", () => {
    expect(VehiculInput.safeParse({ combustibil: "NUCLEAR" }).success).toBe(false);
  });

  it("tratează numere/date goale ca necompletate (nu blochează)", () => {
    const r = VehiculInput.safeParse({ marca: "X", anFabricatie: "", cilindreeCm3: "", dataDobandire: "" });
    expect(r.success).toBe(true);
  });
});
