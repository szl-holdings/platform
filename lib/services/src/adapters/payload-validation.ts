export type JsonRecord = Record<string, unknown>;

export class UpstreamPayloadError extends Error {
  constructor(context: string, detail: string) {
    super(`${context}: ${detail}`);
    this.name = 'UpstreamPayloadError';
  }
}

export function expectRecord(value: unknown, context: string): JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new UpstreamPayloadError(context, 'expected an object');
  }
  return value as JsonRecord;
}

export function optionalRecord(
  record: JsonRecord,
  key: string,
  context: string,
): JsonRecord | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  return expectRecord(value, `${context}.${key}`);
}

export function optionalArray(
  record: JsonRecord,
  key: string,
  context: string,
): unknown[] | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw new UpstreamPayloadError(`${context}.${key}`, 'expected an array');
  }
  return value;
}

export function optionalString(
  record: JsonRecord,
  key: string,
  context: string,
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new UpstreamPayloadError(`${context}.${key}`, 'expected a string');
  }
  return value;
}

export function optionalNullableString(
  record: JsonRecord,
  key: string,
  context: string,
): string | null | undefined {
  const value = record[key];
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') {
    throw new UpstreamPayloadError(`${context}.${key}`, 'expected a string or null');
  }
  return value;
}

export function optionalBoolean(
  record: JsonRecord,
  key: string,
  context: string,
): boolean | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    throw new UpstreamPayloadError(`${context}.${key}`, 'expected a boolean');
  }
  return value;
}

export function optionalNumber(
  record: JsonRecord,
  key: string,
  context: string,
): number | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UpstreamPayloadError(`${context}.${key}`, 'expected a finite number');
  }
  return value;
}

export function optionalNullableNumber(
  record: JsonRecord,
  key: string,
  context: string,
): number | undefined {
  const value = record[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new UpstreamPayloadError(`${context}.${key}`, 'expected a finite number or null');
  }
  return value;
}

export function optionalStringArray(
  record: JsonRecord,
  key: string,
  context: string,
): string[] | undefined {
  const values = optionalArray(record, key, context);
  if (values === undefined) return undefined;
  return values.map((value, index) => {
    if (typeof value !== 'string') {
      throw new UpstreamPayloadError(`${context}.${key}[${index}]`, 'expected a string');
    }
    return value;
  });
}

export function nestedRecord(
  payload: unknown,
  path: readonly string[],
  context: string,
): JsonRecord | undefined {
  let current: JsonRecord | undefined = expectRecord(payload, context);
  for (const key of path) {
    if (current === undefined) return undefined;
    current = optionalRecord(current, key, context);
  }
  return current;
}
