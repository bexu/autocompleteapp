import { describe, expect, it } from "vitest";
import { isValidDate } from "@/lib/validation/date";

describe("isValidDate", () => {
  it("acceptă ISO (yyyy-mm-dd)", () => {
    expect(isValidDate("2026-07-01")).toBe(true);
    expect(isValidDate("2000-02-29")).toBe(true); // an bisect
  });

  it("acceptă formate RO (dd.mm.yyyy / dd-mm-yyyy / dd/mm/yyyy)", () => {
    expect(isValidDate("01.07.2026")).toBe(true);
    expect(isValidDate("1-7-2026")).toBe(true);
    expect(isValidDate("01/07/2026")).toBe(true);
  });

  it("respinge date calendaristice imposibile", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("31.04.2026")).toBe(false);
    expect(isValidDate("2026-13-01")).toBe(false);
    expect(isValidDate("2001-02-29")).toBe(false); // nu e bisect
  });

  it("respinge forme greșite și gunoi", () => {
    expect(isValidDate("")).toBe(false);
    expect(isValidDate("ieri")).toBe(false);
    expect(isValidDate("2026/07")).toBe(false);
    expect(isValidDate("07.2026")).toBe(false);
  });
});
