import assert from 'node:assert/strict';
import test from 'node:test';

import { addedLineNumbers } from './check-claims.ts';

test('extracts only candidate-side lines from zero-context hunks', () => {
  const patch = [
    '@@ -10,2 +10,3 @@',
    '-old',
    '+new one',
    '+new two',
    '+new three',
    '@@ -40 +41 @@',
    '-before',
    '+after',
  ].join('\n');

  assert.deepEqual([...addedLineNumbers(patch)], [10, 11, 12, 41]);
});

test('ignores deletion-only hunks', () => {
  assert.deepEqual([...addedLineNumbers('@@ -5,3 +5,0 @@\n-one\n-two\n-three\n')], []);
});
