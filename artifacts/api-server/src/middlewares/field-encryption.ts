import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "crypto";
import { logger } from "../lib/logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const CURRENT_KEY_VERSION = "v1";

function deriveKey(masterKey: string, context: string): Buffer {
  return Buffer.from(
    createHmac("sha256", Buffer.from(masterKey, "hex"))
      .update(context)
      .digest()
  ).slice(0, KEY_LENGTH);
}

function getMasterKey(): string {
  const key = process.env.FIELD_ENCRYPTION_KEY;
  if (!key || key.length < 64) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FIELD_ENCRYPTION_KEY must be set in production (64+ hex chars = 32 bytes)");
    }
    logger.warn("[field-encryption] FIELD_ENCRYPTION_KEY not set — using dev fallback. DO NOT USE IN PRODUCTION.");
    return "0000000000000000000000000000000000000000000000000000000000000000";
  }
  return key;
}

export interface EncryptedField {
  v: string;
  iv: string;
  tag: string;
  ciphertext: string;
}

export function encryptField(plaintext: string, context = "default"): string {
  const masterKey = getMasterKey();
  const derivedKey = deriveKey(masterKey, context);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, derivedKey, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload: EncryptedField = {
    v: CURRENT_KEY_VERSION,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };

  return JSON.stringify(payload);
}

export function decryptField(encryptedJson: string, context = "default"): string {
  const payload: EncryptedField = JSON.parse(encryptedJson);
  const masterKey = getMasterKey();
  const derivedKey = deriveKey(masterKey, context);

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = createDecipheriv(ALGORITHM, derivedKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export function isEncryptedField(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && "v" in parsed && "iv" in parsed && "ciphertext" in parsed;
  } catch {
    return false;
  }
}

export function encryptPiiFields<T extends Record<string, unknown>>(
  record: T,
  fields: (keyof T)[],
  context = "pii"
): T {
  const result = { ...record };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && value.length > 0) {
      (result as Record<string, unknown>)[field as string] = encryptField(value, context);
    }
  }
  return result;
}

export function decryptPiiFields<T extends Record<string, unknown>>(
  record: T,
  fields: (keyof T)[],
  context = "pii"
): T {
  const result = { ...record };
  for (const field of fields) {
    const value = result[field];
    if (typeof value === "string" && isEncryptedField(value)) {
      try {
        (result as Record<string, unknown>)[field as string] = decryptField(value, context);
      } catch (err) {
        logger.error({ err, field }, "[field-encryption] Failed to decrypt field — returning masked value");
        (result as Record<string, unknown>)[field as string] = "[decryption-error]";
      }
    }
  }
  return result;
}
