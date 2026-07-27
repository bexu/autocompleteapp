import { describe, expect, it } from "vitest";
import { checkRateLimit, guardGeneration, RateLimitError } from "@/lib/http/rate-limit";

describe("checkRateLimit — fereastră glisantă", () => {
  it("permite până la `max`, apoi respinge în aceeași fereastră", () => {
    const key = `k_${Math.random()}`;
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit(key, 3, 60_000, t0 + i)).toBe(true);
    }
    expect(checkRateLimit(key, 3, 60_000, t0 + 3)).toBe(false);
  });

  it("eliberează după ce fereastra trece", () => {
    const key = `k_${Math.random()}`;
    const t0 = 2_000_000;
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3, 60_000, t0 + i);
    expect(checkRateLimit(key, 3, 60_000, t0 + 3)).toBe(false);
    // 61s mai târziu → hit-urile vechi au ieșit din fereastră
    expect(checkRateLimit(key, 3, 60_000, t0 + 61_000)).toBe(true);
  });

  it("izolează cheile între ele (per-user)", () => {
    const t0 = 3_000_000;
    expect(checkRateLimit("userA", 1, 60_000, t0)).toBe(true);
    expect(checkRateLimit("userA", 1, 60_000, t0 + 1)).toBe(false);
    expect(checkRateLimit("userB", 1, 60_000, t0 + 1)).toBe(true); // altă cheie, neafectată
  });

  it("guardGeneration aruncă RateLimitError la depășire", () => {
    const uid = `u_${Math.random()}`;
    for (let i = 0; i < 30; i++) guardGeneration(uid);
    expect(() => guardGeneration(uid)).toThrow(RateLimitError);
  });
});
