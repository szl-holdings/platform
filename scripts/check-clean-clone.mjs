#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

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
    throw new Error(
      `Tracked paths collide on case-insensitive filesystems:\n${detail}`,
    );
  }

  return { trackedPaths: paths.length };
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    const result = verifyTrackedPaths();
    console.log(`[clean-clone] verified ${result.trackedPaths} tracked paths`);
  } catch (error) {
    console.error(`[clean-clone] ${error.message}`);
    process.exitCode = 1;
  }
}
