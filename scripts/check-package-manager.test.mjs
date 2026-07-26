import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { assertPnpm, enforcePackageManager, FOREIGN_LOCKFILES } from './check-package-manager.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'szl-package-manager-'));
  t.after(() => rmSync(root, { force: true, recursive: true }));
  return root;
}

test('accepts pnpm and removes only foreign lockfiles', (t) => {
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
    /Use pnpm instead/,
  );
  assert.equal(existsSync(foreignLock), true);
});

test('rejects yarn and missing user agents', () => {
  assert.throws(() => assertPnpm('yarn/1.22.22'), /Use pnpm instead/);
  assert.throws(() => assertPnpm(''), /Use pnpm instead/);
});
