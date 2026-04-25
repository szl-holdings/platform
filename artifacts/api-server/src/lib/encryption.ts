/**
 * Field-level PII encryption — AES-256-GCM.
 *
 * Requires ENCRYPTION_KEY env var (≥ 16 chars). When unset, encrypt() and
 * decrypt() return null (no-op / disabled mode). Use isEncrypted() before
 * decrypting any column that may contain pre-encryption plaintext rows.
 *
 * Key rotation: set ENCRYPTION_KEY_PREV to the old key; decrypt() retries
 * with the previous key transparently.
 *
 * See docs/operations/GAP-001-credential-rotation.md for key management runbook.
 */

import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes, createHmac } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const PBKDF2_ITERS = 100_000;
const PREFIX = 'v1';
const SALT_DEFAULT = 'szl-pii-v1';

let _cachedKey: Buffer | null = null;
let _prevKeyLoaded = false;
let _cachedPrevKey: Buffer | null = null;

function deriveKey(secret: string, salt: string): Buffer {
  return pbkdf2Sync(secret, salt, PBKDF2_ITERS, KEY_LEN, 'sha256');
}

function getKey(): Buffer | null {
  if (_cachedKey) return _cachedKey;
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret || secret.length < 16) return null;
  const salt = process.env.ENCRYPTION_SALT ?? SALT_DEFAULT;
  _cachedKey = deriveKey(secret, salt);
  return _cachedKey;
}

function getPrevKey(): Buffer | null {
  if (_prevKeyLoaded) return _cachedPrevKey;
  _prevKeyLoaded = true;
  const prev = process.env.ENCRYPTION_KEY_PREV;
  if (!prev) {
    _cachedPrevKey = null;
    return null;
  }
  const salt = process.env.ENCRYPTION_SALT ?? SALT_DEFAULT;
  _cachedPrevKey = deriveKey(prev, salt);
  return _cachedPrevKey;
}

function encodeSegment(buf: Buffer): string {
  return buf.toString('base64url');
}

function decodeSegment(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

function encryptWithKey(plaintext: string, key: Buffer, iv: Buffer): string {
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}.${encodeSegment(iv)}.${encodeSegment(encrypted)}.${encodeSegment(tag)}`;
}

function decryptWithKey(ciphertext: string, key: Buffer): string {
  const parts = ciphertext.split('.');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error('[encryption] Invalid ciphertext format');
  }
  const iv = decodeSegment(parts[1]!);
  const encrypted = decodeSegment(parts[2]!);
  const tag = decodeSegment(parts[3]!);

  if (iv.length !== IV_LEN) throw new Error('[encryption] Invalid IV length');
  if (tag.length !== TAG_LEN) throw new Error('[encryption] Invalid auth tag length');

  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
}

/** Encrypt a plaintext string. Returns null if ENCRYPTION_KEY is unset or input is null. */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const key = getKey();
  if (!key) return null;
  return encryptWithKey(plaintext, key, randomBytes(IV_LEN));
}

/**
 * Deterministic encryption — same plaintext always produces the same ciphertext.
 * Use only for equality-queryable fields (e.g. email lookup). Returns null when
 * ENCRYPTION_KEY is unset.
 */
export function encryptDeterministic(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  const key = getKey();
  if (!key) return null;
  const iv = createHmac('sha256', key).update(plaintext, 'utf8').digest().subarray(0, IV_LEN);
  return encryptWithKey(plaintext, key, iv);
}

/**
 * Decrypt a ciphertext produced by encrypt() or encryptDeterministic().
 * Retries with ENCRYPTION_KEY_PREV for transparent key rotation.
 * Returns null if ENCRYPTION_KEY is unset or input is null.
 */
export function decrypt(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null) return null;
  const key = getKey();
  if (!key) return null;
  try {
    return decryptWithKey(ciphertext, key);
  } catch {
    const prevKey = getPrevKey();
    if (prevKey) {
      try {
        return decryptWithKey(ciphertext, prevKey);
      } catch {
        throw new Error('[encryption] Decryption failed with both current and previous key');
      }
    }
    throw new Error('[encryption] Decryption failed — ciphertext may be corrupt or key mismatch');
  }
}

/**
 * Returns true if the value looks like ciphertext from this module
 * (prefix v1, four dot-separated segments). Use before decrypt() on
 * columns that may contain pre-encryption plaintext rows.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  const parts = value.split('.');
  return parts.length === 4 && parts[0] === PREFIX;
}

/** Reset cached derived keys — for tests that change env vars between cases. */
export function _resetKeyCache(): void {
  _cachedKey = null;
  _prevKeyLoaded = false;
  _cachedPrevKey = null;
}
