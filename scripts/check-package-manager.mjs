#!/usr/bin/env node

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const FOREIGN_LOCKFILES = Object.freeze(['package-lock.json', 'yarn.lock']);
const rootManifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const EXPECTED_PNPM_VERSION =
  rootManifest.packageManager?.match(/^pnpm@(\d+\.\d+\.\d+)$/)?.[1];

export function assertPnpm(userAgent, expectedVersion = EXPECTED_PNPM_VERSION) {
  if (!expectedVersion) {
    throw new Error('package.json must pin packageManager to an exact pnpm semantic version.');
  }
  if (!userAgent.startsWith(`pnpm/${expectedVersion} `)) {
    throw new Error(
      `Use pnpm ${expectedVersion} exactly; received ${userAgent || 'no package-manager user agent'}.`,
    );
  }
}

export function enforcePackageManager({
  userAgent = process.env.npm_config_user_agent ?? '',
  cwd = process.cwd(),
  logger = console,
} = {}) {
  assertPnpm(userAgent);

  const removed = [];
  for (const lockfile of FOREIGN_LOCKFILES) {
    const target = resolve(cwd, lockfile);
    if (!existsSync(target)) continue;
    rmSync(target, { force: true });
    removed.push(lockfile);
  }

  logger.log(
    `[package-manager] pnpm verified${removed.length ? `; removed ${removed.join(', ')}` : ''}`,
  );
  return { removed };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    enforcePackageManager();
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: preinstall failures must explain the required package manager.
    console.error(`[package-manager] ${error.message}`);
    process.exitCode = 1;
  }
}
