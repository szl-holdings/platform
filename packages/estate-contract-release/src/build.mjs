#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstatSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
    id: 'design-system-forge-type-contract',
    role: 'EXPORTED_SOURCE_DEPENDENCY',
    package_name: '@workspace/forge/types',
    inputs: ['packages/forge/package.json', 'packages/forge/src/types.ts'],
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
    role: 'RUNTIME_AND_GENERATED_OUTPUT_PRESENT',
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
    role: 'RUNTIME_AND_GENERATED_OUTPUT_PRESENT',
    package_name: '@szl-holdings/api-zod',
    inputs: ['lib/api-zod/package.json', 'lib/api-zod/src'],
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

function requireRegularTrackedFile(root, path) {
  const absolutePath = resolve(root, path);
  const stat = lstatSync(absolutePath);
  if (stat.isSymbolicLink()) {
    throw new Error(`contract input must not be a symbolic link: ${path}`);
  }
  if (!stat.isFile()) {
    throw new Error(`tracked contract input must be a regular file: ${path}`);
  }
  return absolutePath;
}

function listTrackedFiles(root, inputs) {
  for (const input of inputs) {
    const stat = lstatSync(resolve(root, input));
    if (stat.isSymbolicLink() || (!stat.isFile() && !stat.isDirectory())) {
      throw new Error(`contract input must be a regular file or directory: ${input}`);
    }
  }

  const result = spawnSync('git', ['-C', root, 'ls-files', '-z', '--', ...inputs], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) {
    throw new Error(`unable to enumerate tracked contract inputs: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `unable to enumerate tracked contract inputs: ${String(result.stderr).trim()}`,
    );
  }

  const paths = result.stdout
    .split('\0')
    .filter(Boolean)
    .sort(compareUtf8Bytes);
  for (const input of inputs) {
    const prefix = `${input}/`;
    if (!paths.some((path) => path === input || path.startsWith(prefix))) {
      throw new Error(`contract input contains no tracked files: ${input}`);
    }
  }
  return paths.map((path) => requireRegularTrackedFile(root, path));
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
    const files = listTrackedFiles(root, definition.inputs)
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
      inputs: [...definition.inputs],
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
        'enumerate every Git-tracked file beneath each component input root',
        'recompute every file SHA-256 and byte count',
        'recompute every component tree SHA-256',
        'recompute the release_id over canonical JSON',
      ],
      reject: [
        'mutable main or latest references',
        'missing or additional tracked files inside an allowlisted component',
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
