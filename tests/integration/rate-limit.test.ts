import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  checkRateLimitDb,
  guardGeneration,
  purgeExpiredRateLimitWindows,
  RateLimitError,
} from "@/lib/http/rate-limit";

// Limiter distribuit (Postgres, fereastră fixă). Partajat între instanțe →
// contorul supraviețuiește restartului procesului, spre deosebire de in-memory.
describe("rate-limit distribuit (integration, DB reală)", () => {
  const key = `test_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;

  beforeEach(async () => {
    await prisma.rateLimitWindow.deleteMany({ where: { key: { startsWith: "test_" } } });
    await prisma.rateLimitWindow.deleteMany({ where: { key: { startsWith: "gen:test_" } } });
  });

  afterAll(async () => {
    await prisma.rateLimitWindow.deleteMany({ where: { key: { startsWith: "test_" } } });
    await prisma.rateLimitWindow.deleteMany({ where: { key: { startsWith: "gen:test_" } } });
    await prisma.$disconnect();
  });

  it("permite până la `max` în fereastră, apoi respinge", async () => {
    const t0 = 1_000_000_000;
    for (let i = 0; i < 3; i++) {
      expect(await checkRateLimitDb(key, 3, 60_000, t0 + i)).toBe(true);
    }
    expect(await checkRateLimitDb(key, 3, 60_000, t0 + 3)).toBe(false);
  });

  it("eliberează în fereastra următoare (fixed-window)", async () => {
    const t0 = 2_000_000_000;
    for (let i = 0; i < 3; i++) await checkRateLimitDb(key, 3, 60_000, t0 + i);
    expect(await checkRateLimitDb(key, 3, 60_000, t0 + 3)).toBe(false);
    // 60s mai târziu → fereastră nouă, contor resetat
    expect(await checkRateLimitDb(key, 3, 60_000, t0 + 60_000)).toBe(true);
  });

  it("guardGeneration aruncă RateLimitError la depășire", async () => {
    const uid = `test_${Math.random()}`;
    for (let i = 0; i < 30; i++) await guardGeneration(uid);
    await expect(guardGeneration(uid)).rejects.toBeInstanceOf(RateLimitError);
  });

  it("purgeExpiredRateLimitWindows șterge ferestrele vechi (>1h)", async () => {
    const now = new Date("2026-07-28T12:00:00.000Z");
    await checkRateLimitDb(key, 100, 60_000, new Date("2026-07-28T10:00:00.000Z").getTime()); // veche
    await checkRateLimitDb(key, 100, 60_000, now.getTime()); // recentă
    const purged = await purgeExpiredRateLimitWindows(now);
    expect(purged).toBeGreaterThanOrEqual(1);
    const remaining = await prisma.rateLimitWindow.count({ where: { key } });
    expect(remaining).toBe(1); // doar fereastra recentă rămâne
  });
});
