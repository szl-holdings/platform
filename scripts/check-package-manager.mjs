#!/usr/bin/env node

import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export const FOREIGN_LOCKFILES = Object.freeze(['package-lock.json', 'yarn.lock']);

export function assertPnpm(userAgent) {
  if (!userAgent.startsWith('pnpm/')) {
    throw new Error('Use pnpm instead. npm and yarn installs are not supported.');
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

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    enforcePackageManager();
  } catch (error) {
    console.error(`[package-manager] ${error.message}`);
    process.exitCode = 1;
  }
}
