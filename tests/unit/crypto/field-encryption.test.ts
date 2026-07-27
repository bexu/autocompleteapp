import { createDecipheriv } from "node:crypto";
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

// Descifrează DEK-ul împachetat direct din payload — reproduce „seam-ul" ca să
// putem dovedi unicitatea DEK per valoare (nu doar că ciphertext-ul diferă).
function unwrapDek(payload: string, kekB64: string): Buffer {
  const segs = payload.split(":");
  const kek = Buffer.from(kekB64, "base64");
  const wrapIv = Buffer.from(segs[4], "base64");
  const wrapTag = Buffer.from(segs[5], "base64");
  const wrapCt = Buffer.from(segs[6], "base64");
  const d = createDecipheriv("aes-256-gcm", kek, wrapIv, { authTagLength: 16 });
  d.setAAD(Buffer.from("v1|wrap", "utf8"));
  d.setAuthTag(wrapTag);
  return Buffer.concat([d.update(wrapCt), d.final()]);
}

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

  it("folosește un DEK unic per valoare (32 bytes, diferit)", () => {
    const dek1 = unwrapDek(encryptField(CNP), TEST_KEY);
    const dek2 = unwrapDek(encryptField(CNP), TEST_KEY);
    expect(dek1.length).toBe(32);
    expect(dek1.equals(Buffer.alloc(32))).toBe(false); // nu e cheie nulă
    expect(dek1.equals(dek2)).toBe(false); // unic per apel
  });

  it("detectează alterarea pe FIECARE segment (ambele straturi GCM)", () => {
    // segmente: [0]=v1 [1]=dataIv [2]=dataTag [3]=dataCt [4]=wrapIv [5]=wrapTag [6]=wrapDek
    for (const idx of [1, 2, 3, 4, 5, 6]) {
      const segs = encryptField(CNP).split(":");
      const buf = Buffer.from(segs[idx], "base64");
      buf[0] ^= 0xff;
      segs[idx] = buf.toString("base64");
      expect(() => decryptField(segs.join(":"))).toThrow();
    }
  });

  it("respinge tag-uri trunchiate (authTagLength fixat la 16)", () => {
    const segs = encryptField(CNP).split(":");
    segs[2] = Buffer.from(segs[2], "base64").subarray(0, 4).toString("base64");
    expect(() => decryptField(segs.join(":"))).toThrow(/tag/i);
  });

  it("leagă contextul (AAD): descriptarea cu alt context eșuează", () => {
    const enc = encryptField(CNP, "user-1:cnp");
    expect(decryptField(enc, "user-1:cnp")).toBe(CNP);
    expect(() => decryptField(enc, "user-2:cnp")).toThrow();
    expect(() => decryptField(enc)).toThrow(); // context implicit ≠ cel folosit
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
