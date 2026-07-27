import { describe, expect, it } from "vitest";
import { buildHandoff } from "@/lib/dispatch/handoff";
import { F230_MANIFEST } from "@/lib/forms/f230";

describe("buildHandoff (230)", () => {
  it("produce checklist + canale + termen din manifest", () => {
    const h = buildHandoff(F230_MANIFEST);
    expect(h.formCode).toBe("230");
    expect(h.deadline).toBe("25 mai");
    // canale: SPV + borderou ONG
    expect(h.channels.map((c) => c.id)).toEqual(["spv", "borderou-ong"]);
    // checklist include descărcare, depunere, marcare
    const ids = h.checklist.map((s) => s.id);
    expect(ids).toContain("descarca");
    expect(ids).toContain("depune");
    expect(ids).toContain("marcheaza");
    // 230 nu cere semnătură calificată → fără pas de semnătură
    expect(ids).not.toContain("semnatura");
  });

  it("adaugă pas de semnătură dacă formularul o cere", () => {
    const h = buildHandoff({ ...F230_MANIFEST, signature: "qualified" });
    expect(h.checklist.map((s) => s.id)).toContain("semnatura");
  });
});
