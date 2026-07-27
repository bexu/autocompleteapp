import { describe, expect, it } from "vitest";
import { AUTO_EVENT_DEFS, isAutoEvent } from "@/lib/auto/event";

describe("auto events", () => {
  it("recunoaște evenimentele valide", () => {
    expect(isAutoEvent("VANZARE")).toBe(true);
    expect(isAutoEvent("CUMPARARE")).toBe(true);
    expect(isAutoEvent("ALTCEVA")).toBe(false);
  });

  it("VANZARE: setul ITL-010 + ITL-054 + ITL-016 și checklist", () => {
    const def = AUTO_EVENT_DEFS.VANZARE;
    expect(def.forms.map((f) => f.formCode)).toEqual(["ITL-010", "ITL-054", "ITL-016"]);
    expect(def.checklist.length).toBeGreaterThanOrEqual(3);
  });

  it("CUMPARARE: setul ITL-005 + DGPCI (contractul îl primește de la vânzător)", () => {
    const def = AUTO_EVENT_DEFS.CUMPARARE;
    expect(def.forms.map((f) => f.formCode)).toEqual(["ITL-005", "DGPCI"]);
  });

  it("VANZARE mapează contrapartea în inputurile ITL-054 și ITL-016", () => {
    const input = {
      event: "VANZARE" as const,
      vehicleId: "v1",
      contrapartaNume: "Popescu Dan",
      contrapartaCnp: "5000101123457",
      pret: "15000",
      data: "2026-03-01",
    };
    const c54 = AUTO_EVENT_DEFS.VANZARE.buildInputs(input, "ITL-054");
    expect(c54.cumparatorNume).toBe("Popescu Dan");
    expect(c54.cumparatorCnp).toBe("5000101123457");
    expect(c54.pret).toBe("15000");
    expect(c54.dataContract).toBe("2026-03-01");

    const c16 = AUTO_EVENT_DEFS.VANZARE.buildInputs(input, "ITL-016");
    expect(c16.dobanditorNume).toBe("Popescu Dan");
    expect(c16.dataInstrainare).toBe("2026-03-01");
  });

  it("CUMPARARE setează tipCerere Transcriere pe DGPCI", () => {
    const input = { event: "CUMPARARE" as const, vehicleId: "v1" };
    expect(AUTO_EVENT_DEFS.CUMPARARE.buildInputs(input, "DGPCI").tipCerere).toBe("Transcriere");
  });
});
