#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const OUTPUT_PATH = resolve(
  REPOSITORY_ROOT,
  'packages/estate-contract-release/manifest.json',
);

export const COMPONENT_DEFINITIONS = Object.freeze([
  {
    id: 'design-system',
    role: 'CANONICAL_SOURCE',
    package_name: '@szl-holdings/design-system',
    inputs: ['packages/design-system/package.json', 'packages/design-system/src'],
  },
  {
    id: 'api-spec',
    role: 'CANONICAL_SOURCE',
    package_name: '@szl-holdings/api-spec',
    inputs: [
      'lib/api-spec/package.json',
      'lib/api-spec/openapi.yaml',
      'lib/api-spec/orval.config.ts',
      'lib/api-spec/scripts/codegen.mjs',
    ],
  },
  {
    id: 'api-client-react',
    role: 'GENERATED_OUTPUT_PRESENT',
    package_name: '@szl-holdings/api-client-react',
    inputs: [
      'lib/api-client-react/package.json',
      'lib/api-client-react/src/index.ts',
      'lib/api-client-react/src/custom-fetch.ts',
      'lib/api-client-react/src/standard-hooks.ts',
      'lib/api-client-react/src/generated',
    ],
  },
  {
    id: 'api-zod',
    role: 'GENERATED_OUTPUT_PRESENT',
    package_name: '@szl-holdings/api-zod',
    inputs: ['lib/api-zod/package.json', 'lib/api-zod/src/generated'],
  },
  {
    id: 'shared-contracts',
    role: 'CANONICAL_SOURCE',
    package_name: '@szl-holdings/shared-contracts',
    inputs: ['packages/shared-contracts/package.json', 'packages/shared-contracts/src'],
  },
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function toPosix(path) {
  return path.split(sep).join('/');
}

export function compareUtf8Bytes(left, right) {
  return Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'));
}

function listFiles(path) {
  const stat = lstatSync(path);
  if (stat.isSymbolicLink()) {
    throw new Error(`contract input must not be a symbolic link: ${path}`);
  }
  if (stat.isFile()) {
    return [path];
  }
  if (!stat.isDirectory()) {
    throw new Error(`contract input must be a file or directory: ${path}`);
  }
  return readdirSync(path, { withFileTypes: true })
    .sort((left, right) => compareUtf8Bytes(left.name, right.name))
    .flatMap((entry) => listFiles(resolve(path, entry.name)));
}

export function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJson(entry)).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort(compareUtf8Bytes)
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function buildManifest(root = REPOSITORY_ROOT) {
  const components = COMPONENT_DEFINITIONS.map((definition) => {
    const files = definition.inputs
      .flatMap((input) => listFiles(resolve(root, input)))
      .map((path) => {
        const body = readFileSync(path);
        return {
          path: toPosix(relative(root, path)),
          bytes: body.byteLength,
          sha256: sha256(body),
        };
      })
      .sort((left, right) => compareUtf8Bytes(left.path, right.path));
    const tree = files.map((file) => `${file.path}\0${file.bytes}\0${file.sha256}\n`).join('');
    return {
      id: definition.id,
      role: definition.role,
      package_name: definition.package_name,
      file_count: files.length,
      bytes: files.reduce((total, file) => total + file.bytes, 0),
      tree_sha256: sha256(tree),
      files,
    };
  });

  const release = {
    schema_version: 'szl.estate-contract-release.v1',
    status: 'HASH_CLOSED_SOURCE_RELEASE',
    source_repository: 'https://github.com/szl-holdings/platform',
    evidence_labels: {
      source_bytes: 'VERIFIED_LOCAL',
      generated_output_lineage: 'STRUCTURE_ONLY',
      registry_publication: 'UNAVAILABLE',
      cross_repository_adoption: 'UNAVAILABLE',
      production_deployment: 'UNAVAILABLE',
    },
    components,
    consumer_contract: {
      pin: 'an immutable protected Platform Git revision',
      verify: [
        'recompute every file SHA-256 and byte count',
        'recompute every component tree SHA-256',
        'recompute the release_id over canonical JSON',
      ],
      reject: [
        'mutable main or latest references',
        'missing or additional files inside an allowlisted component',
        'a release_id or component digest mismatch',
        'claims that hash closure proves registry publication or deployment',
      ],
    },
  };
  return {
    ...release,
    release_id: `sha256:${sha256(canonicalJson(release))}`,
  };
}

export function manifestMatchesCurrent(manifest, root = REPOSITORY_ROOT) {
  return canonicalJson(manifest) === canonicalJson(buildManifest(root));
}

export function writeManifest(root = REPOSITORY_ROOT) {
  const manifest = buildManifest(root);
  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

function main() {
  const check = process.argv.includes('--check');
  if (check) {
    const observed = JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'));
    if (!manifestMatchesCurrent(observed)) {
      throw new Error('estate contract manifest is stale; run the package build');
    }
    process.stdout.write(
      `estate-contract-release: PASS ${observed.release_id} (${observed.components.length} components)\n`,
    );
    return;
  }
  const manifest = writeManifest();
  process.stdout.write(
    `estate-contract-release: wrote ${manifest.release_id} (${manifest.components.length} components)\n`,
  );
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`estate-contract-release: ${error.message}\n`);
    process.exitCode = 1;
  }
}
