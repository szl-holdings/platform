export function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sortSemanticallyKeyedArray(values: unknown[]): unknown[] {
  const records = values.filter(
    (value): value is Record<string, unknown> => value !== null && typeof value === 'object',
  );
  if (records.length !== values.length || records.length < 2) {
    return values;
  }

  if (records.every((record) => typeof record.order === 'number')) {
    return [...records].sort((left, right) => Number(left.order) - Number(right.order));
  }

  for (const key of ['claimId', 'materialId', 'stageId', 'id'] as const) {
    if (records.every((record) => typeof record[key] === 'string')) {
      return [...records].sort((left, right) =>
        compareCodeUnits(String(left[key]), String(right[key])),
      );
    }
  }

  return values;
}

export function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return sortSemanticallyKeyedArray(value.map(canonicalize));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => compareCodeUnits(left, right))
        .map(([key, nestedValue]) => [key, canonicalize(nestedValue)]),
    );
  }

  return value;
}

export function canonicalSerialize(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export async function sha256Hex(value: string): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto SHA-256 is unavailable [ATELIER_RESPONSE_CRYPTO_UNAVAILABLE]');
  }
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
