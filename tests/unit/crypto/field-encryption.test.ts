import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resetEnvCache } from "@/lib/config/env";
import {
  decryptField,
  encryptField,
  isEncrypted,
} from "@/lib/crypto/field-encryption";

// Cheie de test deterministă (32 bytes base64).
const TEST_KEY = Buffer.alloc(32, 7).toString("base64");
const CNP = "1920707123456";

describe("field-encryption", () => {
  let original: string | undefined;

  beforeAll(() => {
    original = process.env.ENCRYPTION_MASTER_KEY;
    process.env.ENCRYPTION_MASTER_KEY = TEST_KEY;
    resetEnvCache();
  });

  afterAll(() => {
    if (original === undefined) delete process.env.ENCRYPTION_MASTER_KEY;
    else process.env.ENCRYPTION_MASTER_KEY = original;
    resetEnvCache();
  });

  it("face roundtrip corect", () => {
    const enc = encryptField(CNP);
    expect(decryptField(enc)).toBe(CNP);
  });

  it("nu conține plaintext-ul în ciphertext (dovadă: nu e în clar)", () => {
    const enc = encryptField(CNP);
    expect(enc).not.toContain(CNP);
    expect(isEncrypted(enc)).toBe(true);
  });

  it("produce ciphertext diferit la fiecare apel (IV + DEK aleatoare)", () => {
    expect(encryptField(CNP)).not.toBe(encryptField(CNP));
  });

  it("detectează alterarea (GCM auth tag)", () => {
    const enc = encryptField(CNP);
    const segs = enc.split(":");
    // stricăm ciphertext-ul datelor
    const ct = Buffer.from(segs[3], "base64");
    ct[0] ^= 0xff;
    segs[3] = ct.toString("base64");
    expect(() => decryptField(segs.join(":"))).toThrow();
  });

  it("eșuează la descriptare cu altă cheie", () => {
    const enc = encryptField(CNP);
    process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 9).toString("base64");
    resetEnvCache();
    expect(() => decryptField(enc)).toThrow();
    process.env.ENCRYPTION_MASTER_KEY = TEST_KEY;
    resetEnvCache();
  });

  it("respinge payload malformat", () => {
    expect(() => decryptField("nu-e-un-payload")).toThrow(/invalid/);
  });

  it("gestionează string-uri unicode și goale", () => {
    for (const s of ["", "Ștefan Țăndărei 😀", "a".repeat(5000)]) {
      expect(decryptField(encryptField(s))).toBe(s);
    }
  });
});
