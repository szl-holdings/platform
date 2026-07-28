import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { verifyPublicNpmArtifacts } from './verify-public-npm-artifacts.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), '..', '..');
const EVIDENCE_DIRECTORY = join('audit', 'frontier', 'npm-package-readiness-2026-07-28');
const PACKAGE_MANIFESTS = [
  'packages/mcp-governor/package.json',
  'packages/conformance/package.json',
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function makeFixture() {
  const fixture = await mkdtemp(join(tmpdir(), 'szl-npm-artifact-contract-'));
  await mkdir(join(fixture, EVIDENCE_DIRECTORY), { recursive: true });

  for (const relativePath of PACKAGE_MANIFESTS) {
    const destination = join(fixture, relativePath);
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(REPOSITORY_ROOT, relativePath), destination);
  }

  for (const filename of ['inventory.json', 'szl-mcp-governor-0.1.0.tgz', 'szl-verify-0.1.0.tgz']) {
    await cp(
      join(REPOSITORY_ROOT, EVIDENCE_DIRECTORY, filename),
      join(fixture, EVIDENCE_DIRECTORY, filename),
    );
  }

  return fixture;
}

async function mutateSourceManifest(fixture, mutation) {
  const manifestPath = join(fixture, PACKAGE_MANIFESTS[0]);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  mutation(manifest);
  const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(manifestPath, serialized);

  const inventoryPath = join(fixture, EVIDENCE_DIRECTORY, 'inventory.json');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  inventory.packages[0].sourceManifestSha256 = sha256(serialized);
  await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`);
}

test('accepts the exact preserved publication artifacts', async () => {
  const fixture = await makeFixture();
  try {
    const results = await verifyPublicNpmArtifacts(fixture);
    assert.equal(results.length, 2);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('rejects publish metadata drift even if the source manifest hash is refreshed', async () => {
  const fixture = await makeFixture();
  try {
    await mutateSourceManifest(fixture, (manifest) => {
      manifest.engines.node = '>=25';
    });

    await assert.rejects(verifyPublicNpmArtifacts(fixture), /normalized publish manifest drift/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});

test('rejects prepack gate drift even if the source manifest hash is refreshed', async () => {
  const fixture = await makeFixture();
  try {
    await mutateSourceManifest(fixture, (manifest) => {
      manifest.scripts.prepack = 'node -e "process.exit(0)"';
    });

    await assert.rejects(verifyPublicNpmArtifacts(fixture), /source prepack drift/);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
