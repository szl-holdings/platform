import assert from 'node:assert/strict';
import test from 'node:test';

import { findCaseInsensitiveCollisions } from './check-clean-clone.mjs';

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
