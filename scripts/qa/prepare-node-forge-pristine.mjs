import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertForgeBytes, provenance } from './check-node-forge-backport.mjs';

// Retrieval/hash failures are terminal. No package scripts are executed.
const archiveArgument = process.argv.indexOf('--archive');
let bytes;
if (archiveArgument !== -1) {
  assert.ok(process.argv[archiveArgument + 1], '--archive requires a path');
  bytes = readFileSync(process.argv[archiveArgument + 1]);
} else {
  const response = await fetch(provenance.node_forge.tarball_url, {
    signal: AbortSignal.timeout(30_000),
  });
  assert.ok(response.ok, `Pristine tarball retrieval failed: HTTP ${response.status}`);
  const chunks = [];
  let length = 0;
  for await (const chunk of response.body) {
    length += chunk.length;
    assert.ok(length <= 1_048_576, 'Pristine tarball exceeds the bounded retrieval size');
    chunks.push(chunk);
  }
  bytes = Buffer.concat(chunks);
}
assert.equal(
  `sha512-${createHash('sha512').update(bytes).digest('base64')}`,
  provenance.node_forge.registry_integrity,
  'Pristine registry integrity mismatch',
);
assert.equal(
  createHash('sha256').update(bytes).digest('hex'),
  provenance.node_forge.tarball_sha256,
);

const destination = mkdtempSync(
  join(process.env.RUNNER_TEMP || tmpdir(), 'szl-node-forge-control-'),
);
const archive = join(destination, 'node-forge-1.4.0.tgz');
const extractRoot = join(destination, 'extracted');
writeFileSync(archive, bytes);
mkdirSync(extractRoot);
const entries = execFileSync('tar', ['-tf', archive], { encoding: 'utf8' }).trim().split(/\r?\n/);
assert.ok(entries.length > 0);
for (const entry of entries) {
  assert.ok(
    entry.startsWith('package/') && !entry.includes('\\') && !entry.split('/').includes('..'),
    'Unsafe pristine tarball member',
  );
}
execFileSync('tar', ['-xf', archive, '-C', extractRoot]);
const pristineRoot = join(extractRoot, 'package');
assertForgeBytes(pristineRoot, provenance.node_forge.pristine_rsa_sha256);
if (process.env.GITHUB_ENV) {
  assert.ok(!/[\r\n]/.test(pristineRoot), 'Unsafe environment path');
  appendFileSync(process.env.GITHUB_ENV, `NODE_FORGE_BACKPORT_PRISTINE_ROOT=${pristineRoot}\n`);
}
process.stdout.write(
  `${JSON.stringify({
    evidence_class: 'MEASURED',
    package: 'node-forge@1.4.0',
    bytes: bytes.length,
    pristine_root: pristineRoot,
  })}\n`,
);
