/**
 * SHA-256 + canonical JSON, bundler-safe for Node and browser.
 *
 * Backed by the audited @noble/hashes implementation so receipt hashes
 * are byte-identical to what node:crypto's createHash('sha256') produces,
 * while remaining importable from Vite/Rollup browser bundles.
 */
import { sha256 } from '@noble/hashes/sha2';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils';

export function canonicalJson(value: unknown): string {
  if (value === undefined) return JSON.stringify(null);
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return (
    '{' +
    keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k])).join(',') +
    '}'
  );
}

export function sha256Hex(input: string): string {
  return bytesToHex(sha256(utf8ToBytes(input)));
}

/** SHA-256 over raw bytes (no UTF-8 round-trip). */
export function sha256HexBytes(bytes: Uint8Array): string {
  return bytesToHex(sha256(bytes));
}

/** SHA-256 over the canonical JSON serialization of `value`. */
export function hashJson(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}
