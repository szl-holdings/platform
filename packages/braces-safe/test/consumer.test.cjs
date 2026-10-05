'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readdirSync, realpathSync } = require('node:fs');
const { createRequire } = require('node:module');
const path = require('node:path');

// Check the real pnpm consumer edge, not only a direct import of the fork.
const root = path.resolve(__dirname, '../../..');
const store = path.join(root, 'node_modules/.pnpm');

test('every installed micromatch consumer resolves and executes the private fork', () => {
  const consumers = readdirSync(store).filter((name) => name.startsWith('micromatch@'));
  assert.ok(consumers.length > 0, 'the repository dependency graph must include micromatch');
  const expected = realpathSync(path.resolve(__dirname, '../index.js'));
  for (const consumer of consumers) {
    const requireFromConsumer = createRequire(
      path.join(store, consumer, 'node_modules/micromatch/package.json'),
    );
    assert.equal(realpathSync(requireFromConsumer.resolve('braces')), expected, consumer);
    const micromatch = requireFromConsumer('micromatch');
    assert.deepEqual(micromatch(['a/b', 'a/c', 'a/d'], 'a/{b,c}'), ['a/b', 'a/c']);
    assert.throws(
      () => micromatch.braces('{'.repeat(101) + 'a,b' + '}'.repeat(101)),
      (error) => error instanceof SyntaxError && /exceeds max depth/.test(error.message),
    );
  }
});
