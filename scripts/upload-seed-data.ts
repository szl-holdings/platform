import { Storage } from '@google-cloud/storage';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const REPLIT_SIDECAR_ENDPOINT = 'http://127.0.0.1:1106';

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

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...walkDir(fullPath));
    } else if (fullPath.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

async function uploadSeedData() {
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  if (!bucketId) {
    process.exit(1);
  }

  const seedDataDir = join(process.cwd(), 'seed-data');
  const files = walkDir(seedDataDir);

  if (files.length === 0) {
    return;
  }

  const client = createGCSClient();
  const bucket = client.bucket(bucketId);

  const results = await Promise.allSettled(
    files.map(async (filePath) => {
      const relativePath = relative(seedDataDir, filePath);
      const objectKey = `seed-data/${relativePath.replace(/\\/g, '/')}`;
      const contents = readFileSync(filePath);

      const file = bucket.file(objectKey);
      await file.save(contents, {
        contentType: 'application/json',
        resumable: false,
        metadata: {
          cacheControl: 'no-cache',
        },
      });
      return objectKey;
    }),
  );

  const _succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected');

  if (failed.length > 0) {
    failed.forEach((r) => {
      if (r.status === 'rejected') {
      }
    });
    process.exit(1);
  }
}

uploadSeedData().catch((_err) => {
  process.exit(1);
});
