import { afterEach, describe, expect, it, vi } from "vitest";
import { getEnv, resetEnvCache } from "@/lib/config/env";

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const original = { ...process.env };
  for (const [key, value] of Object.entries(vars)) {
    // process.env coerce orice la string; pentru "absent" ștergem cheia.
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetEnvCache();
  try {
    fn();
  } finally {
    process.env = original;
    resetEnvCache();
  }
}

describe("config/env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCache();
  });

  it("acceptă un mediu de development valid", () => {
    withEnv(
      {
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://app:app@localhost:5432/app",
        ENCRYPTION_MASTER_KEY: undefined,
        BETTER_AUTH_SECRET: undefined,
      },
      () => {
        const env = getEnv();
        expect(env.NODE_ENV).toBe("development");
        expect(env.DATABASE_URL).toContain("postgresql://");
      },
    );
  });

  it("respinge DATABASE_URL care nu e postgresql", () => {
    withEnv(
      { NODE_ENV: "development", DATABASE_URL: "mysql://x" },
      () => {
        expect(() => getEnv()).toThrow(/DATABASE_URL/);
      },
    );
  });

  it("nu scurge valorile secrete în mesajul de eroare", () => {
    withEnv(
      { NODE_ENV: "development", DATABASE_URL: "mysql://super-secret-host" },
      () => {
        try {
          getEnv();
          expect.unreachable("ar fi trebuit să arunce");
        } catch (e) {
          expect((e as Error).message).not.toContain("super-secret-host");
        }
      },
    );
  });

  it("cere secretele în producție", () => {
    withEnv(
      {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://app:app@db:5432/app",
        ENCRYPTION_MASTER_KEY: "",
        BETTER_AUTH_SECRET: "",
      },
      () => {
        expect(() => getEnv()).toThrow(/producție incomplet/);
      },
    );
  });

  it("respinge o cheie de criptare de lungime greșită", () => {
    withEnv(
      {
        NODE_ENV: "development",
        DATABASE_URL: "postgresql://app:app@localhost:5432/app",
        ENCRYPTION_MASTER_KEY: Buffer.from("prea-scurt").toString("base64"),
      },
      () => {
        expect(() => getEnv()).toThrow(/ENCRYPTION_MASTER_KEY/);
      },
    );
  });
});
