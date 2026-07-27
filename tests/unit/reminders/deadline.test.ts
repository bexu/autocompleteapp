import { describe, expect, it } from "vitest";
import { computeNextDeadline } from "@/lib/reminders/deadline";

const RULE_230 = { month: 5, day: 25 }; // 25 mai

describe("computeNextDeadline (25 mai)", () => {
  it("întoarce 25 mai din anul curent dacă nu a trecut", () => {
    const d = computeNextDeadline(RULE_230, new Date("2026-01-10T00:00:00Z"));
    expect(d.toISOString().slice(0, 10)).toBe("2026-05-25");
  });

  it("sare în anul următor dacă termenul a trecut", () => {
    const d = computeNextDeadline(RULE_230, new Date("2026-06-01T00:00:00Z"));
    expect(d.toISOString().slice(0, 10)).toBe("2027-05-25");
  });

  it("include ziua exactă a termenului (nu sare)", () => {
    const d = computeNextDeadline(RULE_230, new Date("2026-05-25T00:00:00Z"));
    expect(d.toISOString().slice(0, 10)).toBe("2026-05-25");
  });

  it("rămâne pe aceeași zi chiar dacă e semnat în cursul zilei termenului", () => {
    // 25 mai la 14:00 → termenul e tot 25 mai (comparație la nivel de zi)
    const d = computeNextDeadline(RULE_230, new Date("2026-05-25T14:00:00Z"));
    expect(d.toISOString().slice(0, 10)).toBe("2026-05-25");
  });
});
