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
// Integritate: tag-ul GCM e verificat cu lungime FIXĂ (16 bytes) pe ambele
// straturi — altfel un tag trunchiat ar slăbi autentificarea (vezi review M0).
// Contextul (AAD) leagă criptografic versiunea și un context opțional
// (ex. `userId:field`), ca un blob să nu poată fi mutat pe alt rând/user.

const ALGO = "aes-256-gcm";
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const VERSION = "v1";
const WRAP_AAD = Buffer.from(`${VERSION}|wrap`, "utf8");

function getKek(): Buffer {
  return getEncryptionMasterKey();
}

function dataAad(context: string): Buffer {
  return Buffer.from(`${VERSION}|data|${context}`, "utf8");
}

function aesGcmEncrypt(
  key: Buffer,
  plaintext: Buffer,
  aad: Buffer,
): { iv: Buffer; tag: Buffer; ct: Buffer } {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv, { authTagLength: TAG_BYTES });
  cipher.setAAD(aad);
  const ct = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, tag, ct };
}

function aesGcmDecrypt(
  key: Buffer,
  iv: Buffer,
  tag: Buffer,
  ct: Buffer,
  aad: Buffer,
): Buffer {
  // Lungimile sunt validate înainte de a ajunge aici; pinăm și authTagLength.
  const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: TAG_BYTES });
  decipher.setAAD(aad);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

/**
 * Criptează un string. Întoarce un payload compact, auto-descriptiv, sigur de
 * stocat în DB (nu conține plaintext-ul). Fiecare apel produce alt ciphertext.
 *
 * @param context AAD opțional (ex. `${userId}:${field}`) legat criptografic de
 *   valoare — la descriptare trebuie furnizat același context.
 */
export function encryptField(plaintext: string, context = ""): string {
  const kek = getKek();
  const dek = randomBytes(KEY_BYTES);

  const data = aesGcmEncrypt(dek, Buffer.from(plaintext, "utf8"), dataAad(context));
  const wrapped = aesGcmEncrypt(kek, dek, WRAP_AAD);

  const parts: Array<string | Buffer> = [
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
export function decryptField(payload: string, context = ""): string {
  const segs = payload.split(":");
  if (segs.length !== 7 || segs[0] !== VERSION) {
    throw new Error("Payload criptat invalid sau versiune necunoscută.");
  }
  const [, ivB64, tagB64, ctB64, wIvB64, wTagB64, wCtB64] = segs;

  const dataIv = Buffer.from(ivB64, "base64");
  const dataTag = Buffer.from(tagB64, "base64");
  const wrapIv = Buffer.from(wIvB64, "base64");
  const wrapTag = Buffer.from(wTagB64, "base64");
  assertLengths(dataIv, dataTag, wrapIv, wrapTag);

  const kek = getKek();
  const dek = aesGcmDecrypt(
    kek,
    wrapIv,
    wrapTag,
    Buffer.from(wCtB64, "base64"),
    WRAP_AAD,
  );

  const plaintext = aesGcmDecrypt(
    dek,
    dataIv,
    dataTag,
    Buffer.from(ctB64, "base64"),
    dataAad(context),
  );
  return plaintext.toString("utf8");
}

function assertLengths(...ivsAndTags: Buffer[]): void {
  const [dataIv, dataTag, wrapIv, wrapTag] = ivsAndTags;
  if (dataIv.length !== IV_BYTES || wrapIv.length !== IV_BYTES) {
    throw new Error("IV invalid în payload criptat.");
  }
  if (dataTag.length !== TAG_BYTES || wrapTag.length !== TAG_BYTES) {
    throw new Error("Auth tag invalid în payload criptat.");
  }
}

/** true dacă string-ul are formatul unui câmp criptat (nu garantează validitatea). */
export function isEncrypted(value: string): boolean {
  return value.startsWith(`${VERSION}:`) && value.split(":").length === 7;
}
