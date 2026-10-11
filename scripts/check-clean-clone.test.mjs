import assert from 'node:assert/strict';
import test from 'node:test';

import {
  containsPackageManagerMutation,
  findCaseInsensitiveCollisions,
  findWorkspaceManifestViolations,
} from './check-clean-clone.mjs';

test('detects case-only and slash-style collisions', () => {
  assert.deepEqual(
    findCaseInsensitiveCollisions([
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/pull_request_template.md',
      'packages\\Tokens\\src\\index.ts',
      'packages/tokens/src/index.ts',
      'README.md',
    ]),
    [
      ['.github/PULL_REQUEST_TEMPLATE.md', '.github/pull_request_template.md'],
      ['packages/tokens/src/index.ts', 'packages\\Tokens\\src\\index.ts'],
    ],
  );
});

test('accepts a portable tracked-path set', () => {
  assert.deepEqual(
    findCaseInsensitiveCollisions([
      '.github/PULL_REQUEST_TEMPLATE.md',
      'packages/tokens/src/index.ts',
      'README.md',
    ]),
    [],
  );
});

test('accepts one exact workspace package-manager authority and immutable release tasks', () => {
  assert.deepEqual(
    findWorkspaceManifestViolations({
      rootPackageManager: 'pnpm@10.26.1',
      manifests: [
        {
          path: 'package.json',
          manifest: {
            packageManager: 'pnpm@10.26.1',
            scripts: { build: 'turbo run build', test: 'turbo run test' },
          },
        },
        {
          path: 'packages/example/package.json',
          manifest: { scripts: { build: 'tsc --build', 'test:unit': 'vitest run' } },
        },
      ],
    }),
    [],
  );
});

test('detects dependency mutation behind recursive, filter, prefix, Corepack, and shell flags', () => {
  for (const command of [
    'pnpm -r install',
    'pnpm --filter foo add bar',
    'npm --prefix /tmp install',
    'corepack pnpm -C packages/x install',
    'sh -c "pnpm --config.verify-deps-before-run=false update"',
    "'pnpm' '--filter' foo 'remove' bar",
  ]) {
    assert.equal(containsPackageManagerMutation(command), true, command);
  }

  for (const command of [
    'pnpm -r run build',
    'pnpm exec vite build',
    'npm run test:install-check',
    'node scripts/install-check.mjs',
  ]) {
    assert.equal(containsPackageManagerMutation(command), false, command);
  }
});

test('rejects split package-manager authority and dependency mutation in release tasks', () => {
  assert.deepEqual(
    findWorkspaceManifestViolations({
      rootPackageManager: 'pnpm@10',
      manifests: [
        { path: 'package.json', manifest: { packageManager: 'pnpm@10' } },
        {
          path: 'packages/example/package.json',
          manifest: {
            packageManager: 'pnpm@11.9.0',
            scripts: {
              build: 'corepack pnpm install && tsc',
              'posttypecheck:strict': 'npm --silent update',
            },
          },
        },
      ],
    }),
    [
      'package.json must pin an exact pnpm version; received pnpm@10',
      'packages/example/package.json overrides packageManager with pnpm@11.9.0; the workspace root pins pnpm@10',
      'packages/example/package.json script build mutates dependencies during a release task: corepack pnpm install && tsc',
      'packages/example/package.json script posttypecheck:strict mutates dependencies during a release task: npm --silent update',
    ],
  );
});
