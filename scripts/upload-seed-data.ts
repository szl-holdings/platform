import { Storage } from '@google-cloud/storage';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

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
  const bucketId = process.env['DEFAULT_OBJECT_STORAGE_BUCKET_ID'];
  if (!bucketId) {
    console.error('ERROR: DEFAULT_OBJECT_STORAGE_BUCKET_ID environment variable is not set');
    process.exit(1);
  }

  const seedDataDir = join(process.cwd(), 'seed-data');
  const files = walkDir(seedDataDir);

  if (files.length === 0) {
    console.log('No JSON files found in seed-data/ directory');
    return;
  }

  const client = createGCSClient();
  const bucket = client.bucket(bucketId);

  console.log(`Uploading ${files.length} seed data files to GCS bucket: ${bucketId}`);

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

      console.log(`  ✓ Uploaded: ${objectKey}`);
      return objectKey;
    }),
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected');

  console.log(`\nUpload complete: ${succeeded}/${files.length} files succeeded`);

  if (failed.length > 0) {
    console.error(`${failed.length} file(s) failed to upload:`);
    failed.forEach((r) => {
      if (r.status === 'rejected') {
        console.error(`  ✗ ${r.reason}`);
      }
    });
    process.exit(1);
  }
}

uploadSeedData().catch((err) => {
  console.error('Fatal error during seed data upload:', err);
  process.exit(1);
});
