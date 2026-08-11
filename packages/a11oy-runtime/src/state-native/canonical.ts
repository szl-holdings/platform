import { createHash, randomUUID } from 'node:crypto';

export type CanonicalJsonValue =
  | null
  | boolean
  | number
  | string
  | readonly CanonicalJsonValue[]
  | { readonly [key: string]: CanonicalJsonValue };

function normalize(value: unknown, stack: Set<object>): CanonicalJsonValue {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new TypeError('Canonical JSON does not support non-finite numbers.');
    }
    return Object.is(value, -0) ? 0 : value;
  }

  if (value instanceof Uint8Array || value instanceof Date) {
    throw new TypeError('Canonical JSON supports only plain objects and arrays.');
  }

  if (Array.isArray(value)) {
    if (stack.has(value)) {
      throw new TypeError('Canonical JSON does not support circular arrays.');
    }
    stack.add(value);
    const result = value.map((item) => normalize(item, stack));
    stack.delete(value);
    return result;
  }

  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const prototype = Object.getPrototypeOf(object);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new TypeError('Canonical JSON supports only plain objects and arrays.');
    }
    if (stack.has(object)) {
      throw new TypeError('Canonical JSON does not support circular objects.');
    }
    stack.add(object);

    const result: Record<string, CanonicalJsonValue> = {};
    for (const key of Object.keys(object).sort()) {
      const item = object[key];
      if (item === undefined) {
        continue;
      }
      if (typeof item === 'bigint' || typeof item === 'function' || typeof item === 'symbol') {
        throw new TypeError(`Canonical JSON does not support ${typeof item} values.`);
      }
      result[key] = normalize(item, stack);
    }

    stack.delete(object);
    return result;
  }

  throw new TypeError(`Canonical JSON does not support ${typeof value} values.`);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value, new Set<object>()));
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex');
}

export function digestObject(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
