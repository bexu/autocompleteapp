import { beforeEach, describe, expect, it } from "vitest";
import {
  _clearRegistry,
  registerManifest,
  selectManifest,
  type FormManifest,
} from "@/lib/forms/manifest";

function m(rev: string, from: string, to?: string, jurisdiction = "national"): FormManifest {
  return {
    id: `230-${jurisdiction}-${rev}`,
    authority: "ANAF",
    jurisdiction,
    formCode: "230",
    revision: rev,
    validFrom: from,
    validTo: to,
    sourceUrl: null,
    sourceSha256: null,
    workflow: "generated",
    signature: "none",
    title: "t",
    fields: [],
    inputs: [],
  };
}

describe("selectManifest", () => {
  beforeEach(() => _clearRegistry());

  it("alege revizia validă la dată (versionare pe perioadă)", () => {
    registerManifest(m("2023", "2023-01-01", "2024-01-01"));
    registerManifest(m("2024", "2024-01-01"));
    expect(selectManifest("230", "national", new Date("2023-06-01"))?.revision).toBe("2023");
    expect(selectManifest("230", "national", new Date("2024-06-01"))?.revision).toBe("2024");
  });

  it("preferă jurisdicția exactă peste national", () => {
    registerManifest(m("2026", "2026-01-01", undefined, "national"));
    registerManifest(m("2026", "2026-01-01", undefined, "cluj"));
    expect(selectManifest("230", "cluj", new Date("2026-06-01"))?.jurisdiction).toBe("cluj");
    expect(selectManifest("230", "bucuresti", new Date("2026-06-01"))?.jurisdiction).toBe("national");
  });

  it("întoarce null dacă nimic nu e valid la acea dată", () => {
    registerManifest(m("2024", "2024-01-01"));
    expect(selectManifest("230", "national", new Date("2020-01-01"))).toBeNull();
    expect(selectManifest("999", "national", new Date("2024-06-01"))).toBeNull();
  });

  it("registerManifest e idempotent pe id", () => {
    registerManifest(m("2024", "2024-01-01"));
    registerManifest(m("2024", "2024-01-01"));
    expect(selectManifest("230", "national", new Date("2024-06-01"))).not.toBeNull();
  });
});
