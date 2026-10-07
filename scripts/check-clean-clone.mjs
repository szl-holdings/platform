#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const RETIRED_ONE_SHOTS = Object.freeze([
  '.github/workflows/update-lockfile-vite.yml',
  '.github/workflows/forge-hf-activate.yml',
  'replit-sync/forge_hf_activate.py',
  'replit-sync/README_FORGE_HF_ACTIVATE.md',
]);

const RELEASE_TASK = /^(?:pre|post)?(?:build|codegen|test|typecheck)(?::|$)/;
const PACKAGE_MANAGERS = new Set(['pnpm', 'npm', 'yarn', 'bun']);
const DEPENDENCY_MUTATIONS = new Set([
  'add',
  'ci',
  'i',
  'install',
  'remove',
  'rm',
  'uninstall',
  'up',
  'update',
]);

export function containsPackageManagerMutation(command) {
  if (typeof command !== 'string') return false;

  // This is deliberately conservative. Release-task scripts must not resolve or
  // mutate dependencies, so any exact mutation verb after a package-manager
  // token in the same shell segment is rejected, regardless of intervening
  // flags or their values. Removing quotes also catches `sh -c` wrappers.
  for (const segment of command.split(/&&|\|\||[;|\n]/)) {
    const words = segment.replaceAll(/["'`]/g, ' ').match(/[A-Za-z0-9_@./${}:+-]+/g) ?? [];
    for (let index = 0; index < words.length; index += 1) {
      const executable = words[index].split('/').at(-1);
      if (!PACKAGE_MANAGERS.has(executable)) continue;
      if (words.slice(index + 1).some((word) => DEPENDENCY_MUTATIONS.has(word))) return true;
    }
  }
  return false;
}

function portablePathKey(path) {
  return path.replaceAll('\\', '/').normalize('NFC').toLowerCase();
}

export function findCaseInsensitiveCollisions(paths) {
  const byPortablePath = new Map();
  for (const path of paths) {
    const key = portablePathKey(path);
    const group = byPortablePath.get(key) ?? [];
    group.push(path);
    byPortablePath.set(key, group);
  }

  return [...byPortablePath.values()]
    .filter((group) => new Set(group).size > 1)
    .map((group) => [...new Set(group)].sort());
}

export function findWorkspaceManifestViolations({ rootPackageManager, manifests }) {
  const violations = [];

  if (!/^pnpm@\d+\.\d+\.\d+$/.test(rootPackageManager ?? '')) {
    violations.push(
      `package.json must pin an exact pnpm version; received ${rootPackageManager ?? 'none'}`,
    );
  }

  for (const { path, manifest } of manifests) {
    if (path !== 'package.json' && manifest.packageManager) {
      if (manifest.packageManager !== rootPackageManager) {
        violations.push(
          `${path} overrides packageManager with ${manifest.packageManager}; the workspace root pins ${rootPackageManager}`,
        );
      }
    }

    for (const [name, command] of Object.entries(manifest.scripts ?? {})) {
      if (!RELEASE_TASK.test(name) || typeof command !== 'string') continue;
      if (containsPackageManagerMutation(command)) {
        violations.push(
          `${path} script ${name} mutates dependencies during a release task: ${command}`,
        );
      }
    }
  }

  return violations;
}

export function verifyTrackedPaths({
  cwd = process.cwd(),
  gitExecutable = process.env.GIT_EXECUTABLE ?? 'git',
} = {}) {
  const result = spawnSync(gitExecutable, ['ls-files', '-z'], {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(`Unable to inspect tracked paths: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`git ls-files failed: ${result.stderr.trim() || `exit ${result.status}`}`);
  }

  const paths = result.stdout.split('\0').filter(Boolean);
  const collisions = findCaseInsensitiveCollisions(paths);
  if (collisions.length) {
    const detail = collisions.map((group) => `  - ${group.join(' <> ')}`).join('\n');
    throw new Error(`Tracked paths collide on case-insensitive filesystems:\n${detail}`);
  }

  const tracked = new Set(paths);
  const resurrected = RETIRED_ONE_SHOTS.filter((path) => tracked.has(path));
  if (resurrected.length) {
    const detail = resurrected.map((path) => `  - ${path}`).join('\n');
    throw new Error(`Retired direct-mutation one-shots were restored:\n${detail}`);
  }

  const packagePaths = paths.filter(
    (path) => path === 'package.json' || path.endsWith('/package.json'),
  );
  const manifests = packagePaths.map((path) => {
    try {
      return { path, manifest: JSON.parse(readFileSync(resolve(cwd, path), 'utf8')) };
    } catch (error) {
      throw new Error(`Unable to parse tracked manifest ${path}: ${error.message}`);
    }
  });
  const rootManifest = manifests.find(({ path }) => path === 'package.json')?.manifest;
  const manifestViolations = findWorkspaceManifestViolations({
    rootPackageManager: rootManifest?.packageManager,
    manifests,
  });
  if (manifestViolations.length) {
    const detail = manifestViolations.map((violation) => `  - ${violation}`).join('\n');
    throw new Error(`Workspace package-manager policy failed:\n${detail}`);
  }

  return {
    trackedPaths: paths.length,
    retiredOneShots: RETIRED_ONE_SHOTS.length,
    packageManifests: packagePaths.length,
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    const result = verifyTrackedPaths();
    // biome-ignore lint/suspicious/noConsole: CLI success evidence is consumed by local users and CI.
    console.log(
      `[clean-clone] verified ${result.trackedPaths} tracked paths, ${result.retiredOneShots} retired one-shots, and ${result.packageManifests} package manifests`,
    );
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: CLI failures must be visible to local users and CI.
    console.error(`[clean-clone] ${error.message}`);
    process.exitCode = 1;
  }
}
