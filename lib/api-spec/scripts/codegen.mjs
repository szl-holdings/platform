#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const GENERATED_CLIENTS = Object.freeze([
  '../api-client-react/src/generated/api.ts',
  '../api-zod/src/generated/api.ts',
]);

const defaultPackageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function generatedClientsPresent(packageRoot = defaultPackageRoot) {
  return GENERATED_CLIENTS.every((relativePath) =>
    existsSync(resolve(packageRoot, relativePath)),
  );
}

export function ensureGeneratedClients({
  packageRoot = defaultPackageRoot,
  runner = spawnSync,
  orvalExecutable = process.platform === 'win32' ? 'orval.cmd' : 'orval',
  logger = console,
} = {}) {
  if (generatedClientsPresent(packageRoot)) {
    logger.log('codegen artifacts present, skipping orval');
    return { generated: false };
  }

  const result = runner(orvalExecutable, ['--config', './orval.config.ts'], {
    cwd: packageRoot,
    stdio: 'inherit',
    windowsHide: true,
    shell: process.platform === 'win32',
  });
  if (result.error) {
    throw new Error(`Unable to start Orval: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Orval failed with exit code ${result.status}`);
  }

  return { generated: true };
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isMain) {
  try {
    ensureGeneratedClients();
  } catch (error) {
    console.error(`[api-codegen] ${error.message}`);
    process.exitCode = 1;
  }
}
