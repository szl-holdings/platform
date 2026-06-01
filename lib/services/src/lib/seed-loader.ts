import { Storage } from '@google-cloud/storage';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';
const SEED_DATA_PREFIX = 'seed-data';

function createGCSClient(): Storage {
  return new Storage({
    credentials: {
      audience: 'replit',
      subject_token_type: 'access_token',
      token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
      type: 'external_account',
      credential_source: {
        url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
        format: {
          type: 'json',
          subject_token_field_name: 'access_token',
        },
      },
      universe_domain: 'googleapis.com',
    } as any,
    projectId: '',
  });
}

async function loadFromGCS<T>(objectKey: string): Promise<T | null> {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) return null;

  try {
    const client = createGCSClient();
    const bucket = client.bucket(bucketId);
    const file = bucket.file(`${SEED_DATA_PREFIX}/${objectKey}`);
    const [exists] = await file.exists();
    if (!exists) return null;

    const [contents] = await file.download();
    return JSON.parse(contents.toString('utf-8')) as T;
  } catch {
    return null;
  }
}

function resolveLocalPath(relativePath: string): string | null {
  const candidates: string[] = [];

  if (process.env.SEED_DATA_DIR) {
    candidates.push(join(process.env.SEED_DATA_DIR, relativePath));
  }

  candidates.push(join(process.cwd(), 'seed-data', relativePath));

  try {
    const currentFileUrl = import.meta.url;
    const currentDir = dirname(fileURLToPath(currentFileUrl));
    candidates.push(join(currentDir, '../../../../seed-data', relativePath));
    candidates.push(join(currentDir, '../../../../../seed-data', relativePath));
  } catch {}

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function loadFromLocalFile<T>(relativePath: string): T | null {
  const filePath = resolveLocalPath(relativePath);
  if (!filePath) return null;
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export async function loadSeedData<T>(objectKey: string, fallback: T): Promise<T> {
  const gcsData = await loadFromGCS<T>(objectKey);
  if (gcsData !== null) return gcsData;

  const localData = loadFromLocalFile<T>(objectKey);
  if (localData !== null) return localData;

  return fallback;
}

export function loadSeedDataSync<T>(relativePath: string, fallback: T): T {
  const localData = loadFromLocalFile<T>(relativePath);
  return localData !== null ? localData : fallback;
}

export function applyOffsetMinutes(
  items: Array<Record<string, any>>,
  fields: string[],
): Array<Record<string, any>> {
  return items.map((item) => {
    const result = { ...item };
    for (const field of fields) {
      const offsetField = `${field}OffsetMinutes`;
      if (typeof result[offsetField] === 'number') {
        result[field] = new Date(Date.now() - result[offsetField] * 60 * 1000).toISOString();
        delete result[offsetField];
      }
    }
    return result;
  });
}

export function applyOffsetDays(
  items: Array<Record<string, any>>,
  field: string,
  daysField: string,
  direction: 'past' | 'future' = 'future',
): Array<Record<string, any>> {
  return items.map((item) => {
    const result = { ...item };
    if (typeof result[daysField] === 'number') {
      const ms = result[daysField] * 24 * 60 * 60 * 1000;
      result[field] = new Date(
        direction === 'future' ? Date.now() + ms : Date.now() - ms,
      ).toISOString();
      delete result[daysField];
    }
    return result;
  });
}
