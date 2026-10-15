import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync,
  createReadStream,
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { assertForgeBytes, provenance } from './check-node-forge-backport.mjs';

// These reviewed pins are independent of the data-only provenance receipt.
// Neither an environment variable nor a receipt edit can redirect retrieval.
export const PRISTINE_URL = 'https://registry.npmjs.org/node-forge/-/node-forge-1.4.0.tgz';
export const PRISTINE_INTEGRITY =
  'sha512-LarFH0+6VfriEhqMMcLX2F7SwSXeWwnEAJEsYm5QKWchiVYVvJyV9v7UDvUv+w5HO23ZpQTXDv/GxdDdMyOuoQ==';
export const PRISTINE_SHA256 = 'bf9d7ca0d774235354697bd4b5e642af6505e7ce2066762c3b855138cf870820';
const PRISTINE_RSA_SHA256 = 'fd4740238145ec26470eb3f06a627c72039538ce1307dbdce40521f94dfd0a50';
export const MAX_ARCHIVE_BYTES = 1_048_576;
export const MAX_UNPACKED_BYTES = 4_194_304;

function tarEnvironment() {
  return { ...process.env, TAR_OPTIONS: '', LC_ALL: 'C' };
}

export function assertPristineProvenance(receipt = provenance) {
  assert.equal(receipt.node_forge.tarball_url, PRISTINE_URL, 'Pristine URL receipt drift');
  assert.equal(receipt.node_forge.registry_integrity, PRISTINE_INTEGRITY);
  assert.equal(receipt.node_forge.tarball_sha256, PRISTINE_SHA256);
  assert.equal(receipt.node_forge.pristine_rsa_sha256, PRISTINE_RSA_SHA256);
}

export async function readBoundedArchive(stream) {
  const chunks = [];
  let length = 0;
  for await (const chunk of stream) {
    length += chunk.length;
    assert.ok(length <= MAX_ARCHIVE_BYTES, 'Pristine tarball exceeds the bounded retrieval size');
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function downloadPristineArchive() {
  assertPristineProvenance();
  const response = await fetch(PRISTINE_URL, {
    redirect: 'error',
    credentials: 'omit',
    signal: AbortSignal.timeout(30_000),
  });
  assert.ok(response.ok, `Pristine tarball retrieval failed: HTTP ${response.status}`);
  assert.ok(response.body, 'Pristine tarball response has no body');
  return readBoundedArchive(response.body);
}

export function assertPristineArchive(bytes) {
  assert.ok(
    bytes.length <= MAX_ARCHIVE_BYTES,
    'Pristine tarball exceeds the bounded retrieval size',
  );
  assert.equal(
    `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
    PRISTINE_INTEGRITY,
    'Pristine registry integrity mismatch',
  );
  assert.equal(createHash('sha256').update(bytes).digest('hex'), PRISTINE_SHA256);
}

// Inspect the entire bounded archive before creating any extraction directory.
// GNU tar is also used for extraction, so list/extract agree on PAX/GNU names.
export function validatePristineMembers(bytes) {
  const unpacked = gunzipSync(bytes, { maxOutputLength: MAX_UNPACKED_BYTES });
  const options = {
    input: unpacked,
    encoding: 'utf8',
    timeout: 5_000,
    maxBuffer: 131_072,
    env: tarEnvironment(),
  };
  const listArguments = ['--list', '--file=-', '--quoting-style=escape'];
  const entries = execFileSync('tar', listArguments, options).trim().split(/\r?\n/);
  const details = execFileSync('tar', [...listArguments, '--verbose'], options)
    .trim()
    .split(/\r?\n/);
  assert.ok(entries.length > 0 && entries.length <= 128, 'Unsafe pristine tarball member count');
  assert.equal(new Set(entries).size, entries.length, 'Duplicate pristine tarball member');
  assert.equal(details.length, entries.length, 'Inconsistent pristine tarball inventory');
  let declaredBytes = 0;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    assert.ok(
      /^package\/[A-Za-z0-9._/-]+$/.test(entry) &&
        entry.split('/').every((part) => part !== '' && part !== '.' && part !== '..'),
      'Unsafe pristine tarball member path',
    );
    assert.ok(details[index].startsWith('-'), 'Pristine tarball must contain only regular files');
    const size = Number(details[index].match(/^-\S{9}\s+\S+\s+([0-9]+)\s/)?.[1]);
    assert.ok(Number.isSafeInteger(size), 'Invalid pristine member size');
    declaredBytes += size;
    assert.ok(
      declaredBytes <= MAX_UNPACKED_BYTES,
      'Pristine members exceed the unpacked size limit',
    );
  }
  return unpacked;
}

export function preparePristineControl(
  bytes,
  {
    temporaryRoot = process.env.RUNNER_TEMP || tmpdir(),
    environmentFile = process.env.GITHUB_ENV,
  } = {},
) {
  assertPristineProvenance();
  assertPristineArchive(bytes);
  const unpacked = validatePristineMembers(bytes);
  const destination = mkdtempSync(join(temporaryRoot, 'szl-node-forge-control-'));
  try {
    const extractRoot = join(destination, 'extracted');
    mkdirSync(extractRoot, { mode: 0o700 });
    // No shell, intermediate archive file, package scripts, owner restoration,
    // links, special files, or overwrite of a pre-existing archive member.
    execFileSync(
      'tar',
      [
        '--extract',
        '--file=-',
        '--directory',
        extractRoot,
        '--no-same-owner',
        '--no-same-permissions',
        '--keep-old-files',
      ],
      { input: unpacked, timeout: 5_000, maxBuffer: 131_072, env: tarEnvironment() },
    );
    const pristineRoot = join(extractRoot, 'package');
    assertForgeBytes(pristineRoot, PRISTINE_RSA_SHA256);
    if (environmentFile) {
      assert.ok(!/[\r\n]/.test(pristineRoot), 'Unsafe environment path');
      appendFileSync(environmentFile, `NODE_FORGE_BACKPORT_PRISTINE_ROOT=${pristineRoot}\n`);
    }
    return {
      evidence_class: 'MEASURED',
      package: 'node-forge@1.4.0',
      bytes: bytes.length,
      pristine_root: pristineRoot,
    };
  } catch (error) {
    rmSync(destination, { recursive: true, force: true });
    throw error;
  }
}

export async function main(args = process.argv.slice(2)) {
  let bytes;
  if (args.length === 0) {
    bytes = await downloadPristineArchive();
  } else {
    assert.ok(args.length === 2 && args[0] === '--archive', 'Usage: --archive <path>');
    const metadata = statSync(args[1]);
    assert.ok(metadata.isFile(), 'Pristine archive must be a regular file');
    assert.ok(
      metadata.size <= MAX_ARCHIVE_BYTES,
      'Pristine tarball exceeds the bounded retrieval size',
    );
    bytes = await readBoundedArchive(
      createReadStream(args[1], {
        signal: AbortSignal.timeout(30_000),
      }),
    );
  }
  const receipt = preparePristineControl(bytes);
  process.stdout.write(`${JSON.stringify(receipt)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
