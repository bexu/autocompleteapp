import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";
import { getEncryptionMasterKey } from "@/lib/config/env";

// Envelope encryption pentru câmpuri sensibile (CNP, serie/nr CI etc.).
// Vezi docs/adr/0005-envelope-encryption.md.
//
// Model:
//   - KEK (Key Encryption Key) = ENCRYPTION_MASTER_KEY (32 bytes, din env/vault).
//   - Per valoare generăm un DEK (Data Encryption Key) aleator de 32 bytes.
//   - Plaintext-ul e criptat cu DEK (AES-256-GCM, IV aleator).
//   - DEK-ul e „împachetat" (wrapped) cu KEK (AES-256-GCM, IV aleator).
//   - Stocăm împreună: versiune + IV-uri + tag-uri + DEK împachetat + ciphertext.
//
// Avantaje: rotația KEK se face re-împachetând DEK-urile, fără re-criptarea
// datelor; KEK-ul poate migra ulterior într-un KMS înlocuind doar wrap/unwrap.

const ALGO = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const VERSION = "v1";

function getKek(): Buffer {
  return getEncryptionMasterKey();
}

function aesGcmEncrypt(key: Buffer, plaintext: Buffer): {
  iv: Buffer;
  tag: Buffer;
  ct: Buffer;
} {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, ct };
}

function aesGcmDecrypt(key: Buffer, iv: Buffer, tag: Buffer, ct: Buffer): Buffer {
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

/**
 * Criptează un string. Întoarce un payload compact, auto-descriptiv, sigur de
 * stocat în DB (nu conține plaintext-ul). Fiecare apel produce alt ciphertext.
 */
export function encryptField(plaintext: string): string {
  const kek = getKek();
  const dek = randomBytes(KEY_BYTES);

  const data = aesGcmEncrypt(dek, Buffer.from(plaintext, "utf8"));
  const wrapped = aesGcmEncrypt(kek, dek);

  const parts = [
    VERSION,
    data.iv,
    data.tag,
    data.ct,
    wrapped.iv,
    wrapped.tag,
    wrapped.ct, // DEK împachetat
  ];
  return parts
    .map((p) => (typeof p === "string" ? p : p.toString("base64")))
    .join(":");
}

/** Descriptează un payload produs de `encryptField`. */
export function decryptField(payload: string): string {
  const segs = payload.split(":");
  if (segs.length !== 7 || segs[0] !== VERSION) {
    throw new Error("Payload criptat invalid sau versiune necunoscută.");
  }
  const [, ivB64, tagB64, ctB64, wIvB64, wTagB64, wCtB64] = segs;
  const kek = getKek();

  const dek = aesGcmDecrypt(
    kek,
    Buffer.from(wIvB64, "base64"),
    Buffer.from(wTagB64, "base64"),
    Buffer.from(wCtB64, "base64"),
  );

  const plaintext = aesGcmDecrypt(
    dek,
    Buffer.from(ivB64, "base64"),
    Buffer.from(tagB64, "base64"),
    Buffer.from(ctB64, "base64"),
  );
  return plaintext.toString("utf8");
}

/** true dacă string-ul are formatul unui câmp criptat (nu garantează validitatea). */
export function isEncrypted(value: string): boolean {
  return value.startsWith(`${VERSION}:`) && value.split(":").length === 7;
}
