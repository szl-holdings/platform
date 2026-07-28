import assert from 'node:assert/strict';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { SOURCE_MANIFESTS, sha256 } from './public-npm-contract.mjs';
import { verifyPublicNpmArtifacts } from './verify-public-npm-artifacts.mjs';

const REPOSITORY_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EVIDENCE_PATH = join('audit', 'frontier', 'npm-package-readiness-2026-07-28');

let fixtureRoot;

beforeEach(async () => {
  fixtureRoot = await mkdtemp(join(tmpdir(), 'szl-npm-artifact-verifier-'));

  for (const manifestPath of SOURCE_MANIFESTS.values()) {
    const destination = join(fixtureRoot, manifestPath);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(join(REPOSITORY_ROOT, manifestPath), destination);
  }

  const evidenceDirectory = join(fixtureRoot, EVIDENCE_PATH);
  await mkdir(evidenceDirectory, { recursive: true });
  for (const filename of ['inventory.json', 'szl-mcp-governor-0.1.0.tgz', 'szl-verify-0.1.0.tgz']) {
    await copyFile(
      join(REPOSITORY_ROOT, EVIDENCE_PATH, filename),
      join(evidenceDirectory, filename),
    );
  }
});

afterEach(async () => {
  await rm(fixtureRoot, { recursive: true, force: true });
});

async function mutateSourceManifest(packageName, mutation) {
  const manifestPath = SOURCE_MANIFESTS.get(packageName);
  assert(manifestPath);

  const manifest = JSON.parse(await readFile(join(fixtureRoot, manifestPath), 'utf8'));
  mutation(manifest);
  const changedManifest = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(join(fixtureRoot, manifestPath), changedManifest, 'utf8');

  const inventoryPath = join(fixtureRoot, EVIDENCE_PATH, 'inventory.json');
  const inventory = JSON.parse(await readFile(inventoryPath, 'utf8'));
  const packageEvidence = inventory.packages.find(({ name }) => name === packageName);
  assert(packageEvidence);
  packageEvidence.sourceManifestSha256 = sha256(changedManifest);
  await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');
}

test('accepts the exact retained source manifests and tarballs', async () => {
  const results = await verifyPublicNpmArtifacts(fixtureRoot);
  assert.deepEqual(
    results.map(({ name }) => name),
    ['@szl/mcp-governor', '@szl/verify'],
  );
});

test('rejects prepack drift even when its source-manifest inventory hash is refreshed', async () => {
  await mutateSourceManifest('@szl/mcp-governor', (manifest) => {
    manifest.scripts.prepack = 'node ./different-prepack.mjs';
  });

  await assert.rejects(
    verifyPublicNpmArtifacts(fixtureRoot),
    /@szl\/mcp-governor embedded publication contract drift/,
  );
});

test('rejects publish metadata drift when its source-manifest inventory hash is refreshed', async () => {
  await mutateSourceManifest('@szl/mcp-governor', (manifest) => {
    manifest.engines.node = '>=25';
  });

  await assert.rejects(
    verifyPublicNpmArtifacts(fixtureRoot),
    /@szl\/mcp-governor embedded publication contract drift/,
  );
});

test('rejects a missing source prepack gate', async () => {
  await mutateSourceManifest('@szl/mcp-governor', (manifest) => {
    delete manifest.scripts.prepack;
  });

  await assert.rejects(
    verifyPublicNpmArtifacts(fixtureRoot),
    /@szl\/mcp-governor source prepack gate missing/,
  );
});

test('rejects an inventory that omits an expected package', async () => {
  const inventoryPath = join(fixtureRoot, EVIDENCE_PATH, 'inventory.json');
  const inventory = JSON.parse(
    await readFile(join(REPOSITORY_ROOT, EVIDENCE_PATH, 'inventory.json'), 'utf8'),
  );
  inventory.packages = inventory.packages.filter(({ name }) => name !== '@szl/verify');
  await writeFile(inventoryPath, `${JSON.stringify(inventory, null, 2)}\n`, 'utf8');

  await assert.rejects(
    verifyPublicNpmArtifacts(fixtureRoot),
    /npm artifact inventory must contain every expected package exactly once/,
  );
});
