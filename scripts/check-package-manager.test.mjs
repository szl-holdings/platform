import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join, relative, sep } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  assertPnpm,
  EXPECTED_PNPM_VERSION,
  enforcePackageManager,
  FOREIGN_LOCKFILES,
} from './check-package-manager.mjs';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
// Use Git Bash on Windows, rather than a possible WSL bash.exe. Fixtures
// belong to the Windows checkout and must use that shell's path namespace.
const gitBash = join(process.env.ProgramFiles ?? 'C:\\Program Files', 'Git/bin/bash.exe');
const bashExecutable = process.platform === 'win32' && existsSync(gitBash) ? gitBash : 'bash';

function bashPath(path) {
  if (process.platform !== 'win32') return path;
  const result = spawnSync(bashExecutable, ['-c', 'cygpath -u "$1"', 'fixture', path], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  return result.stdout.trim();
}

function escapedRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NODE_26_PNPM_DOCKERFILES = [
  'apps/alloy-embedding-api/Dockerfile',
  'apps/alloy-ingestion-orchestrator/Dockerfile',
  'apps/alloy-runtime-api/Dockerfile',
  'artifacts/carlota-jo/Dockerfile',
  'artifacts/terra/Dockerfile',
  'artifacts/vessels/Dockerfile',
  'services/alloy-fabric-api/Dockerfile',
  'services/alloy-fabric-ingest-control/Dockerfile',
  'services/substrate-mcp-gateway/Dockerfile',
  'workers/alloy-rank-worker/Dockerfile',
  'workers/alloy-vector-worker/Dockerfile',
];

const IGNORED_SOURCE_DIRECTORIES = new Set(['.git', '.turbo', 'coverage', 'dist', 'node_modules']);

function findSourceDockerfiles(directory = repositoryRoot) {
  const dockerfiles = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_SOURCE_DIRECTORIES.has(entry.name)) {
        dockerfiles.push(...findSourceDockerfiles(join(directory, entry.name)));
      }
      continue;
    }
    if (entry.isFile() && entry.name.startsWith('Dockerfile')) {
      dockerfiles.push(relative(repositoryRoot, join(directory, entry.name)).split(sep).join('/'));
    }
  }
  return dockerfiles.sort();
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'szl-package-manager-'));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return root;
}

function writeExecutable(path, lines) {
  writeFileSync(path, `${lines.join('\n')}\n`, { mode: 0o755 });
}

test('activation survives an unusable HOME and failing Corepack under caller set -e', (t) => {
  const root = fixture(t);
  const repository = join(root, 'repository');
  const scripts = join(repository, 'scripts');
  const fakeBin = join(root, 'bin');
  const unusableHome = join(root, 'unwritable-home');
  const activationLog = join(root, 'activation.log');
  const explicitCorepackHome = join(root, 'corepack-state');
  const expectedPnpmHome = join(root, '.pnpm-home');

  mkdirSync(scripts, { recursive: true });
  mkdirSync(fakeBin);
  copyFileSync(join(repositoryRoot, 'scripts/activate-pnpm.sh'), join(scripts, 'activate-pnpm.sh'));
  // A regular file is deterministically unusable as HOME even for privileged
  // test runners; the old helper aborted trying to create a child directory.
  writeFileSync(unusableHome, 'not a directory\n');
  writeExecutable(join(fakeBin, 'pnpm'), ['#!/usr/bin/env bash', "printf '%s\\n' '11.19.0'"]);
  writeExecutable(join(fakeBin, 'corepack'), [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    `printf 'corepack:%s\\n' "$*" >> "$ACTIVATION_LOG"`,
    'exit 73',
  ]);
  writeExecutable(join(fakeBin, 'npm'), [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    `printf 'npm:%s\\n' "$*" >> "$ACTIVATION_LOG"`,
    'prefix=""',
    'while [[ "$#" -gt 0 ]]; do',
    '  case "$1" in',
    '    --prefix)',
    '      prefix="$2"',
    '      shift 2',
    '      ;;',
    '    *)',
    '      shift',
    '      ;;',
    '  esac',
    'done',
    '[[ -n "$prefix" ]]',
    'mkdir -p "$prefix/node_modules/pnpm/bin"',
    `printf '%s\\n' '#!/usr/bin/env bash' "printf '%s\\\\n' '10.26.1'" > "$prefix/node_modules/pnpm/bin/pnpm.cjs"`,
    'chmod +x "$prefix/node_modules/pnpm/bin/pnpm.cjs"',
  ]);

  const env = {
    ...process.env,
    ACTIVATION_LOG: bashPath(activationLog),
    COREPACK_HOME: bashPath(explicitCorepackHome),
    HOME: bashPath(unusableHome),
    PATH: `${fakeBin}${delimiter}${process.env.PATH ?? process.env.Path ?? ''}`,
  };
  // Windows environment keys are case-insensitive; keep one authoritative PATH.
  if (process.platform === 'win32') delete env.Path;
  delete env.PNPM_HOME;

  const result = spawnSync(
    bashExecutable,
    [
      '-c',
      [
        'set -euo pipefail',
        'source scripts/activate-pnpm.sh',
        `printf 'home=%s\\n' "$HOME"`,
        `printf 'pnpm_home=%s\\n' "$PNPM_HOME"`,
        `printf 'corepack_home=%s\\n' "$COREPACK_HOME"`,
        `printf 'pnpm_command=%s\\n' "$(command -v pnpm)"`,
        `printf 'pnpm_version=%s\\n' "$(pnpm --version)"`,
      ].join('\n'),
    ],
    { cwd: repository, encoding: 'utf8', env },
  );

  assert.equal(result.status, 0, `stderr:\n${result.stderr}`);
  assert.match(result.stdout, new RegExp(`^home=${escapedRegex(bashPath(unusableHome))}$`, 'm'));
  assert.match(
    result.stdout,
    new RegExp(`^pnpm_home=${escapedRegex(bashPath(expectedPnpmHome))}$`, 'm'),
  );
  assert.match(
    result.stdout,
    new RegExp(`^corepack_home=${escapedRegex(bashPath(explicitCorepackHome))}$`, 'm'),
  );
  assert.match(
    result.stdout,
    new RegExp(`^pnpm_command=${escapedRegex(bashPath(expectedPnpmHome))}/pnpm$`, 'm'),
  );
  assert.match(result.stdout, /^pnpm_version=10\.26\.1$/m);

  const log = readFileSync(activationLog, 'utf8');
  assert.match(
    log,
    new RegExp(`corepack:enable --install-directory ${escapedRegex(bashPath(expectedPnpmHome))}`),
  );
  assert.match(log, /corepack:prepare pnpm@10\.26\.1 --activate/);
  assert.match(
    log,
    new RegExp(
      `npm:install --prefix ${escapedRegex(bashPath(expectedPnpmHome))}/\\.npm-bootstrap --no-save --package-lock=false --ignore-scripts --no-audit --no-fund pnpm@10\\.26\\.1`,
    ),
  );
  assert.equal(existsSync(join(unusableHome, '.local/share/pnpm')), false);
});

test('activation prefers explicit writable pnpm and Corepack homes', (t) => {
  const root = fixture(t);
  const repository = join(root, 'repository');
  const scripts = join(repository, 'scripts');
  const unusableHome = join(root, 'unwritable-home');
  const explicitPnpmHome = join(root, 'explicit-pnpm');
  const explicitCorepackHome = join(root, 'explicit-corepack');

  mkdirSync(scripts, { recursive: true });
  mkdirSync(explicitPnpmHome);
  copyFileSync(join(repositoryRoot, 'scripts/activate-pnpm.sh'), join(scripts, 'activate-pnpm.sh'));
  writeFileSync(unusableHome, 'not a directory\n');
  writeExecutable(join(explicitPnpmHome, 'pnpm'), [
    '#!/usr/bin/env bash',
    "printf '%s\\n' '10.26.1'",
  ]);

  const result = spawnSync(
    bashExecutable,
    [
      '-c',
      [
        'set -euo pipefail',
        'source scripts/activate-pnpm.sh',
        `printf 'home=%s\\n' "$HOME"`,
        `printf 'pnpm_home=%s\\n' "$PNPM_HOME"`,
        `printf 'corepack_home=%s\\n' "$COREPACK_HOME"`,
        `printf 'pnpm_version=%s\\n' "$(pnpm --version)"`,
      ].join('\n'),
    ],
    {
      cwd: repository,
      encoding: 'utf8',
      env: {
        ...process.env,
        COREPACK_HOME: bashPath(explicitCorepackHome),
        HOME: bashPath(unusableHome),
        PNPM_HOME: bashPath(explicitPnpmHome),
      },
    },
  );

  assert.equal(result.status, 0, `stderr:\n${result.stderr}`);
  assert.match(result.stdout, new RegExp(`^home=${escapedRegex(bashPath(unusableHome))}$`, 'm'));
  assert.match(
    result.stdout,
    new RegExp(`^pnpm_home=${escapedRegex(bashPath(explicitPnpmHome))}$`, 'm'),
  );
  assert.match(
    result.stdout,
    new RegExp(`^corepack_home=${escapedRegex(bashPath(explicitCorepackHome))}$`, 'm'),
  );
  assert.match(result.stdout, /^pnpm_version=10\.26\.1$/m);
});

test('accepts pnpm and removes only foreign lockfiles', (t) => {
  assert.equal(EXPECTED_PNPM_VERSION, '10.26.1');
  const root = fixture(t);
  for (const lockfile of [...FOREIGN_LOCKFILES, 'pnpm-lock.yaml']) {
    writeFileSync(join(root, lockfile), 'fixture\n');
  }

  const result = enforcePackageManager({
    userAgent: 'pnpm/10.26.1 npm/? node/v24.14.0 win32 x64',
    cwd: root,
    logger: { log() {} },
  });

  assert.deepEqual(result.removed, [...FOREIGN_LOCKFILES]);
  assert.equal(existsSync(join(root, 'package-lock.json')), false);
  assert.equal(existsSync(join(root, 'yarn.lock')), false);
  assert.equal(existsSync(join(root, 'pnpm-lock.yaml')), true);
});

test('rejects npm before changing the checkout', (t) => {
  const root = fixture(t);
  const foreignLock = join(root, 'package-lock.json');
  writeFileSync(foreignLock, 'fixture\n');

  assert.throws(
    () =>
      enforcePackageManager({
        userAgent: 'npm/11.9.0 node/v24.14.0 win32 x64',
        cwd: root,
        logger: { log() {} },
      }),
    /Use pnpm 10\.26\.1 exactly/,
  );
  assert.equal(existsSync(foreignLock), true);
});

test('rejects yarn and missing user agents', () => {
  assert.throws(() => assertPnpm('yarn/1.22.22'), /Use pnpm 10\.26\.1 exactly/);
  assert.throws(() => assertPnpm(''), /Use pnpm 10\.26\.1 exactly/);
  assert.throws(
    () => assertPnpm('pnpm/11.19.0 npm/? node/v24.19.0 linux x64'),
    /Use pnpm 10\.26\.1 exactly/,
  );
});

test('Node 26 pnpm Dockerfiles install the exact root-pinned package manager', async (t) => {
  assert.equal(EXPECTED_PNPM_VERSION, '10.26.1');

  const node26PnpmDockerfiles = findSourceDockerfiles().filter((file) => {
    const source = readFileSync(join(repositoryRoot, file), 'utf8');
    return /^FROM node:26-/m.test(source) && /\bpnpm\b/.test(source);
  });

  assert.deepEqual(node26PnpmDockerfiles, NODE_26_PNPM_DOCKERFILES);

  for (const file of node26PnpmDockerfiles) {
    await t.test(file, () => {
      const source = readFileSync(join(repositoryRoot, file), 'utf8');
      const versionArgs = source.match(/^ARG PNPM_VERSION=10\.26\.1$/gm) ?? [];
      const installs = source.match(/npm install --global "pnpm@\$\{PNPM_VERSION\}"/g) ?? [];
      const versionChecks =
        source.match(/test "\$\(pnpm --version\)" = "\$\{PNPM_VERSION\}"/g) ?? [];

      assert.doesNotMatch(source, /\bcorepack\s+enable\b/i, `${file} invokes Corepack`);
      assert.doesNotMatch(
        source,
        /^COPY[^\n]*(?:\|\||2>|&&)/m,
        `${file} contains shell syntax in a Docker COPY instruction`,
      );
      assert.match(
        source,
        /^FROM node:26-[^\s]+@sha256:[a-f0-9]{64} AS pnpm-base$/m,
        `${file} must declare a digest-pinned pnpm-base stage`,
      );
      assert.equal(versionArgs.length, 1, `${file} must pin pnpm 10.26.1 exactly once`);
      assert.equal(installs.length, 1, `${file} must install the pinned pnpm exactly once`);
      assert.equal(versionChecks.length, 1, `${file} must verify the installed pnpm version`);
      assert.match(source, /^FROM pnpm-base AS deps$/m, `${file} deps must inherit pnpm-base`);
      assert.match(
        source,
        /^FROM pnpm-base AS builder$/m,
        `${file} builder must inherit pnpm-base`,
      );

      const depsStart = source.indexOf('FROM pnpm-base AS deps');
      const builderStart = source.indexOf('FROM pnpm-base AS builder');
      const depsStage = source.slice(depsStart, builderStart);
      const patchCopy = depsStage.indexOf('COPY patches/ ./patches/');
      const dependencyResolution = depsStage.search(
        /RUN(?:[^\n]*\n)*?[^\n]*pnpm (?:fetch|install)/,
      );
      assert.notEqual(patchCopy, -1, `${file} deps stage must copy local patches`);
      assert.notEqual(dependencyResolution, -1, `${file} deps stage must resolve dependencies`);
      assert.ok(
        patchCopy < dependencyResolution,
        `${file} must copy patches before pnpm resolves patched dependencies`,
      );

      const nextStageStart = source.indexOf('\nFROM ', builderStart + 1);
      const builderStage = source.slice(
        builderStart,
        nextStageStart === -1 ? source.length : nextStageStart,
      );
      const builderInstructions = builderStage
        .replace(/\\\r?\n[ \t]*/g, ' ')
        .split(/\r?\n/)
        .map((instruction) => instruction.trim())
        .filter(Boolean);
      const productionEnvironmentIndex = builderInstructions.findIndex((instruction) =>
        /^ENV\s+NODE_ENV=production(?:\s|$)/.test(instruction),
      );

      for (const [installIndex, instruction] of builderInstructions.entries()) {
        if (!/\bpnpm install\b/.test(instruction) || !/--frozen-lockfile\b/.test(instruction)) {
          continue;
        }
        const feedsLaterBuild = builderInstructions
          .slice(installIndex + 1)
          .some(
            (laterInstruction) =>
              /^RUN\b/.test(laterInstruction) &&
              /\b(?:run build|turbo run build|exec tsc --build|pnpm\b.*\sbuild)\b/.test(
                laterInstruction,
              ),
          );
        if (
          productionEnvironmentIndex !== -1 &&
          productionEnvironmentIndex < installIndex &&
          feedsLaterBuild
        ) {
          assert.match(
            instruction,
            /--prod=false\b/,
            `${file} production-mode builder install must retain devDependencies with --prod=false`,
          );
        }
      }

      if (/pnpm install --frozen-lockfile/.test(depsStage)) {
        assert.match(
          builderStage,
          /COPY --from=deps \/app\/ \.\//,
          `${file} selective builder must retain the dependency-stage workspace metadata`,
        );
      } else {
        assert.match(
          builderStage,
          /COPY \.\/ \.\//,
          `${file} builder must copy the patch-aware workspace before its frozen install`,
        );
      }
    });
  }
});

test('vector worker image preserves the glibc native Transformers/ONNX runtime', () => {
  const file = 'workers/alloy-vector-worker/Dockerfile';
  const source = readFileSync(join(repositoryRoot, file), 'utf8');

  assert.match(
    source,
    /^FROM node:26-(?:bookworm|bookworm-slim)@sha256:[a-f0-9]{64} AS pnpm-base$/m,
    `${file} package-manager base must be digest-pinned Debian/glibc`,
  );
  assert.match(
    source,
    /^FROM node:26-(?:bookworm|bookworm-slim)@sha256:[a-f0-9]{64} AS runtime$/m,
    `${file} runtime must be digest-pinned Debian/glibc`,
  );
  assert.doesNotMatch(source, /^FROM node:26-alpine\b/m, `${file} must not use musl/Alpine`);

  const runtimeStart = source.search(/^FROM .* AS runtime$/m);
  assert.notEqual(runtimeStart, -1, `${file} must declare a runtime stage`);
  const runtimeStage = source.slice(runtimeStart);
  const deployedDependencies = runtimeStage.search(
    /^COPY --from=builder --chown=node:node \/app\/deploy\/node_modules \.\/node_modules$/m,
  );
  const nativeImportSmoke = runtimeStage.search(
    /^RUN node\b[^\n]*import\(['"]@huggingface\/transformers['"]\)[^\n]*\bpipeline\b/m,
  );
  const nonrootUser = runtimeStage.search(/^USER node$/m);

  assert.notEqual(deployedDependencies, -1, `${file} must copy deployed production dependencies`);
  assert.notEqual(
    nativeImportSmoke,
    -1,
    `${file} must smoke the deployed Transformers/ONNX native import during image build`,
  );
  assert.notEqual(nonrootUser, -1, `${file} runtime must use the built-in nonroot node user`);
  assert.ok(
    deployedDependencies < nativeImportSmoke,
    `${file} native import smoke must run after deployed dependencies are copied`,
  );
  assert.ok(nativeImportSmoke < nonrootUser, `${file} native import smoke must run at build time`);
  assert.doesNotMatch(
    runtimeStage,
    /\b(?:adduser|useradd)\b/,
    `${file} runtime must use the image's built-in node user`,
  );
});
