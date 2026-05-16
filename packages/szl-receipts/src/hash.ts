import { createHash } from 'node:crypto';

/**
 * Canonical JSON: object keys sorted lexicographically, recursively.
 * Arrays preserve order. `undefined` is dropped (matches `JSON.stringify`).
 * Numbers, booleans, null, strings use `JSON.stringify` defaults.
 */
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
  return createHash('sha256').update(input).digest('hex');
}

/** SHA-256 over the canonical JSON serialization of `value`. */
export function hashJson(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}
