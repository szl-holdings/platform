import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export async function deployProduction(packageName, targetDirectory) {
  assert.ok(packageName && targetDirectory, 'A package name and deployment target are required');
  const sharedLockfile = await readFile(join(REPO_ROOT, 'pnpm-lock.yaml'), 'utf8');
  const installedModules = parseYaml(
    await readFile(join(REPO_ROOT, 'node_modules/.modules.yaml'), 'utf8'),
  );
  assert.equal(typeof installedModules.storeDir, 'string');
  assert.ok(installedModules.storeDir.length > 0);
  // Native pnpm 10 deploy derives a frozen deployment lockfile from the shared
  // lockfile, including linked workspace importers. Legacy deploy re-resolves
  // manifest ranges and requires registry metadata a frozen install never
  // fetches. Keep injection command-local; the source workspace stays linked.
  // Explicit storeDir matters when the target is on a different filesystem.
  const result = spawnSync(
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    [
      '--ignore-scripts',
      '--offline',
      `--store-dir=${installedModules.storeDir}`,
      '--config.inject-workspace-packages=true',
      '--filter',
      packageName,
      'deploy',
      '--prod',
      resolve(targetDirectory),
    ],
    { cwd: REPO_ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  );
  assert.equal(
    result.status,
    0,
    `${packageName} production deploy failed\n${result.error ?? ''}\n${result.stdout ?? ''}\n${result.stderr ?? ''}`,
  );
  const deployedLockfile = parseYaml(
    await readFile(join(resolve(targetDirectory), 'pnpm-lock.yaml'), 'utf8'),
  );
  assert.deepEqual(Object.keys(deployedLockfile.importers), ['.']);
  assert.equal(await readFile(join(REPO_ROOT, 'pnpm-lock.yaml'), 'utf8'), sharedLockfile);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await deployProduction(process.argv[2], process.argv[3]);
}
