import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getEncryptionMasterKey,
  getEnv,
  resetEnvCache,
} from "@/lib/config/env";

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
        BETTER_AUTH_URL: "https://app.example.ro",
      },
      () => {
        expect(() => getEnv()).toThrow(/producție/);
      },
    );
  });

  it("aplică verificările fail-closed când NODE_ENV e nesetat", () => {
    withEnv(
      {
        NODE_ENV: undefined,
        DATABASE_URL: "postgresql://app:app@db:5432/app",
        ENCRYPTION_MASTER_KEY: "",
        BETTER_AUTH_SECRET: "",
      },
      () => {
        // Fără NODE_ENV explicit dev/test → nu are voie să treacă fail-open.
        expect(() => getEnv()).toThrow(/producție/);
      },
    );
  });

  it("cere https non-localhost pe BETTER_AUTH_URL în producție", () => {
    const key = Buffer.alloc(32, 1).toString("base64");
    withEnv(
      {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://app:app@db:5432/app",
        ENCRYPTION_MASTER_KEY: key,
        BETTER_AUTH_SECRET: "x".repeat(32),
        BETTER_AUTH_URL: "http://localhost:3000",
      },
      () => {
        expect(() => getEnv()).toThrow(/BETTER_AUTH_URL/);
      },
    );
  });

  it("acceptă un config de producție complet și sigur", () => {
    const key = Buffer.alloc(32, 1).toString("base64");
    withEnv(
      {
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://app:app@db:5432/app",
        ENCRYPTION_MASTER_KEY: key,
        BETTER_AUTH_SECRET: "x".repeat(32),
        BETTER_AUTH_URL: "https://app.example.ro",
      },
      () => {
        expect(getEnv().NODE_ENV).toBe("production");
      },
    );
  });
});

describe("getEncryptionMasterKey", () => {
  afterEach(() => resetEnvCache());

  it("aruncă dacă lipsește cheia", () => {
    withEnv({ ENCRYPTION_MASTER_KEY: undefined }, () => {
      expect(() => getEncryptionMasterKey()).toThrow(/lipsește/);
    });
  });

  it("aruncă la lungime greșită", () => {
    withEnv(
      { ENCRYPTION_MASTER_KEY: Buffer.alloc(16, 1).toString("base64") },
      () => {
        expect(() => getEncryptionMasterKey()).toThrow(/32 bytes/);
      },
    );
  });

  it("întoarce un Buffer de 32 bytes pentru o cheie validă", () => {
    withEnv(
      { ENCRYPTION_MASTER_KEY: Buffer.alloc(32, 5).toString("base64") },
      () => {
        const key = getEncryptionMasterKey();
        expect(key).toHaveLength(32);
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
