import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import {
  buildPublicationContract,
  normalizePublishManifest,
  SOURCE_MANIFESTS,
  sha256,
} from './public-npm-contract.mjs';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), '..', '..');

function headerText(header, start, end) {
  const terminator = header.indexOf(0, start);
  const boundary = terminator >= start && terminator < end ? terminator : end;
  return header.subarray(start, boundary).toString('utf8').trim();
}

function tarEntries(tarball) {
  const archive = gunzipSync(tarball);
  const entries = new Map();
  let offset = 0;

  while (offset + 512 <= archive.length) {
    const header = archive.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;

    const name = headerText(header, 0, 100);
    const prefix = headerText(header, 345, 500);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const sizeText = headerText(header, 124, 136);
    const size = sizeText ? Number.parseInt(sizeText, 8) : 0;
    assert(Number.isSafeInteger(size) && size >= 0, `invalid tar size for ${fullName}`);

    const bodyStart = offset + 512;
    const bodyEnd = bodyStart + size;
    assert(bodyEnd <= archive.length, `truncated tar entry: ${fullName}`);
    const type = header[156];
    if (type === 0 || type === 48) {
      entries.set(fullName, archive.subarray(bodyStart, bodyEnd));
    }
    offset = bodyStart + Math.ceil(size / 512) * 512;
  }

  return entries;
}

export async function verifyPublicNpmArtifacts(repositoryRoot = REPOSITORY_ROOT) {
  const evidenceDirectory = join(
    repositoryRoot,
    'audit',
    'frontier',
    'npm-package-readiness-2026-07-28',
  );
  const inventory = JSON.parse(await readFile(join(evidenceDirectory, 'inventory.json'), 'utf8'));
  assert.equal(inventory.schemaVersion, 'szl.npm-package-readiness.v2');
  assert.equal(inventory.status, 'TARBALL_VERIFIED_REGISTRY_UNAVAILABLE');
  assert.deepEqual(
    inventory.packages.map(({ name }) => name).sort(),
    [...SOURCE_MANIFESTS.keys()].sort(),
    'npm artifact inventory must contain every expected package exactly once',
  );

  const results = [];
  for (const packageEvidence of inventory.packages) {
    const sourceManifestPath = SOURCE_MANIFESTS.get(packageEvidence.name);
    assert(sourceManifestPath, `unexpected package: ${packageEvidence.name}`);

    const tarball = await readFile(join(evidenceDirectory, packageEvidence.filename));
    assert.equal(sha256(tarball), packageEvidence.sha256, `${packageEvidence.name} tarball drift`);

    const sourceManifest = await readFile(join(repositoryRoot, sourceManifestPath));
    assert.equal(
      sha256(sourceManifest),
      packageEvidence.sourceManifestSha256,
      `${packageEvidence.name} source manifest drift`,
    );

    const entries = tarEntries(tarball);
    const packedManifest = entries.get('package/package.json');
    assert(packedManifest, `${packageEvidence.name} packed manifest missing`);
    assert.equal(
      sha256(packedManifest),
      packageEvidence.packedManifestSha256,
      `${packageEvidence.name} packed manifest drift`,
    );

    const publicationContract = entries.get('package/publication-contract.json');
    assert(publicationContract, `${packageEvidence.name} publication contract missing`);
    assert.equal(
      sha256(publicationContract),
      packageEvidence.publicationContractSha256,
      `${packageEvidence.name} publication contract digest drift`,
    );
    const expectedContract = buildPublicationContract(sourceManifest);
    const packedContract = JSON.parse(publicationContract.toString('utf8'));
    assert.deepEqual(
      packedContract,
      expectedContract,
      `${packageEvidence.name} embedded publication contract drift`,
    );

    const files = [...entries.keys()]
      .filter((path) => path.startsWith('package/'))
      .map((path) => path.slice('package/'.length))
      .sort();
    assert.deepEqual(
      files,
      [...packageEvidence.files].sort(),
      `${packageEvidence.name} file drift`,
    );

    const packedMetadata = JSON.parse(packedManifest.toString('utf8'));
    assert.equal(
      packedMetadata.scripts?.prepack,
      undefined,
      `${packageEvidence.name} packed manifest unexpectedly exposes prepack`,
    );
    const normalizedPacked = normalizePublishManifest(packedMetadata);
    assert.deepEqual(
      normalizedPacked.publishManifest,
      expectedContract.publishManifest,
      `${packageEvidence.name} source-to-packed publish manifest drift`,
    );
    assert.deepEqual(
      normalizedPacked.developmentDependencyNames,
      expectedContract.developmentDependencyNames,
      `${packageEvidence.name} development dependency-name drift`,
    );
    assert.equal(packedMetadata.name, packageEvidence.name);
    assert.equal(packedMetadata.version, packageEvidence.version);
    assert.equal(packedMetadata.private, false);
    assert.equal(packedMetadata.publishConfig?.access, 'public');

    results.push({
      name: packageEvidence.name,
      version: packageEvidence.version,
      sha256: packageEvidence.sha256,
      files: files.length,
    });
  }

  return results;
}

if (resolve(process.argv[1] || '') === SCRIPT_PATH) {
  try {
    const results = await verifyPublicNpmArtifacts();
    process.stdout.write(`${JSON.stringify({ verified: true, packages: results }, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `npm artifact verification failed: ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 1;
  }
}
