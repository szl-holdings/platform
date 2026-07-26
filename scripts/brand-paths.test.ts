import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
  isFrontendPortablePath,
  isIgnoredPortablePath,
  normalizePortablePath,
  trackedPortablePath,
} from './brand-paths.ts';

const ignoredPaths = new Set(['node_modules', 'lib/services']);
const ignoredDirectoryNames = new Set(['node_modules', 'dist']);

test('normalizes Windows separators before portable path comparisons', () => {
  assert.equal(
    normalizePortablePath('packages\\example\\node_modules\\dependency\\index.ts'),
    'packages/example/node_modules/dependency/index.ts',
  );
});

test('ignores Windows-shaped dependency and exact-prefix paths', () => {
  assert.equal(
    isIgnoredPortablePath(
      'packages\\example\\node_modules\\dependency\\index.ts',
      ignoredPaths,
      ignoredDirectoryNames,
    ),
    true,
  );
  assert.equal(
    isIgnoredPortablePath(
      'lib\\services\\src\\adapters\\vendor.ts',
      ignoredPaths,
      ignoredDirectoryNames,
    ),
    true,
  );
  assert.equal(
    isIgnoredPortablePath('packages\\example\\src\\index.ts', ignoredPaths, ignoredDirectoryNames),
    false,
  );
});

test('classifies Windows-shaped frontend paths without treating the API as frontend', () => {
  assert.equal(isFrontendPortablePath('artifacts\\a11oy\\src\\App.tsx'), true);
  assert.equal(isFrontendPortablePath('artifacts\\api-server\\src\\app.ts'), false);
});

test('preserves the raw Git path for filesystem reads while normalizing policy comparisons', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'szl-brand-path-'));
  t.after(() => rmSync(root, { force: true, recursive: true }));

  const rawRelativePath = `cafe\u0301.ts`;
  const tracked = trackedPortablePath(root, rawRelativePath);
  writeFileSync(tracked.absolutePath, 'receipt-payload\n');

  assert.equal(tracked.rawRelativePath, rawRelativePath);
  assert.equal(tracked.policyRelativePath, 'café.ts');
  assert.notEqual(tracked.rawRelativePath, tracked.policyRelativePath);
  assert.equal(readFileSync(tracked.absolutePath, 'utf8'), 'receipt-payload\n');
});
