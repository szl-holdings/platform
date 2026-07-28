import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPOSITORY_ROOT = resolve(dirname(SCRIPT_PATH), '..', '..');

export const PUBLICATION_CONTRACT_SCHEMA = 'szl.npm-publication-contract.v1';
export const SOURCE_MANIFESTS = new Map([
  ['@szl/mcp-governor', 'packages/mcp-governor/package.json'],
  ['@szl/verify', 'packages/conformance/package.json'],
]);

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

export function normalizePublishManifest(manifest) {
  const normalized = structuredClone(manifest);
  const sourcePrepack = normalized.scripts?.prepack ?? null;
  const developmentDependencyNames = Object.keys(normalized.devDependencies ?? {}).sort();

  delete normalized.devDependencies;
  if (normalized.scripts) {
    delete normalized.scripts.prepack;
    if (Object.keys(normalized.scripts).length === 0) delete normalized.scripts;
  }

  return {
    publishManifest: canonicalize(normalized),
    sourcePrepack,
    developmentDependencyNames,
  };
}

export function buildPublicationContract(sourceManifest) {
  const manifest = JSON.parse(sourceManifest.toString('utf8'));
  const normalized = normalizePublishManifest(manifest);
  assert(
    typeof normalized.sourcePrepack === 'string' && normalized.sourcePrepack.trim().length > 0,
    `${manifest.name} source prepack gate missing`,
  );
  return canonicalize({
    schemaVersion: PUBLICATION_CONTRACT_SCHEMA,
    packageName: manifest.name,
    sourceManifestSha256: sha256(sourceManifest),
    sourcePrepack: normalized.sourcePrepack,
    developmentDependencyNames: normalized.developmentDependencyNames,
    publishManifest: normalized.publishManifest,
  });
}

export function serializePublicationContract(contract) {
  return `${JSON.stringify(canonicalize(contract), null, 2)}\n`;
}

async function updateContracts({ check }) {
  for (const [packageName, manifestPath] of SOURCE_MANIFESTS) {
    const sourceManifest = await readFile(join(REPOSITORY_ROOT, manifestPath));
    const expected = serializePublicationContract(buildPublicationContract(sourceManifest));
    const contractPath = join(
      dirname(join(REPOSITORY_ROOT, manifestPath)),
      'publication-contract.json',
    );

    if (check) {
      const actual = await readFile(contractPath, 'utf8');
      assert.equal(actual, expected, `${packageName} publication contract is stale`);
    } else {
      await writeFile(contractPath, expected, 'utf8');
    }
  }
}

if (resolve(process.argv[1] || '') === SCRIPT_PATH) {
  updateContracts({ check: process.argv.includes('--check') })
    .then(() => {
      process.stdout.write(
        `npm publication contracts: ${process.argv.includes('--check') ? 'PASS' : 'UPDATED'}\n`,
      );
    })
    .catch((error) => {
      process.stderr.write(
        `npm publication contract verification failed: ${
          error instanceof Error ? error.message : String(error)
        }\n`,
      );
      process.exitCode = 1;
    });
}
