import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const VIRTUAL_STORE = path.join(ROOT, 'node_modules', '.pnpm');
const require = createRequire(import.meta.url);

function requireHardenedBracesFromConsumer() {
  const direct = require(path.join(ROOT, 'packages', 'braces-safe'));
  const consumerRequire = createRequire(
    path.join(VIRTUAL_STORE, 'micromatch@4.0.8', 'node_modules', 'micromatch', 'package.json'),
  );
  const resolved = consumerRequire('braces');
  assert.equal(resolved, direct, 'micromatch must resolve the repository-local hardened braces');
  return resolved;
}

function mixedNesting(depth) {
  let pattern = 'x';
  for (let index = 0; index < depth; index++) {
    pattern = index % 2 === 0 ? `{${pattern}}` : `(${pattern})`;
  }
  return pattern;
}

function nestedAst(depth) {
  let node = { type: 'text', value: 'x' };
  for (let index = 0; index < depth; index++) {
    node = { type: 'group', nodes: [node] };
  }
  return { type: 'root', nodes: [node] };
}

function nestedValue(depth) {
  let value = 'x';
  for (let index = 0; index < depth; index++) value = [value];
  return value;
}

function astWithValue(value) {
  return { type: 'root', nodes: [{ type: 'text', value }] };
}

function assertSyntaxError(callback, message, description) {
  assert.throws(
    callback,
    (error) => error instanceof SyntaxError && message.test(error.message),
    description,
  );
}

test('hardened braces fork binds its exact source provenance', () => {
  const manifest = JSON.parse(
    readFileSync(path.join(ROOT, 'packages', 'braces-safe', 'package.json'), 'utf8'),
  );
  const metadata = manifest.szlSecurityBackport;
  assert.equal(manifest.version, '0.2.0');
  assert.equal(metadata.upstreamPackage, 'braces@3.0.3');
  assert.equal(metadata.advisory, 'GHSA-vfj7-8cjw-p6xm');
  assert.equal(
    metadata.upstreamIntegrity,
    'sha512-yQbXgO/OSZVD2IsiLlro+7Hf6Q18EJrKSEsdoMzKePKXct3gvD8oLcOQdIzGupr5Fj+EDe8gO/lxc1BzfMpxvA==',
  );
  assert.equal(metadata.localHardeningPatch, 'patches/braces@3.0.3.patch');
  const patchPath = path.join(ROOT, metadata.localHardeningPatch);
  const stat = lstatSync(patchPath);
  assert.ok(stat.isFile());
  assert.equal(stat.isSymbolicLink(), false);
  assert.equal(
    createHash('sha256').update(readFileSync(patchPath)).digest('hex'),
    metadata.localHardeningPatchSha256,
  );
});

test('hardened braces rejects excessive recursive AST nesting', () => {
  const braces = requireHardenedBracesFromConsumer();

  const nested = (open, close, depth) => `${open.repeat(depth)}x${close.repeat(depth)}`;
  assert.doesNotThrow(() => braces(nested('{', '}', 100)));
  assert.throws(() => braces(nested('{', '}', 101)), /nesting depth exceeds max depth \(100\)/);
  assert.throws(() => braces(nested('(', ')', 101)), /nesting depth exceeds max depth \(100\)/);
  assert.doesNotThrow(() => braces(mixedNesting(100)));
  assert.throws(() => braces(mixedNesting(101)), /nesting depth exceeds max depth \(100\)/);
});

test('hardened braces enforces custom depth with a single stateful option read', () => {
  const braces = requireHardenedBracesFromConsumer();
  let reads = 0;
  const options = Object.defineProperty({}, 'maxDepth', {
    get() {
      reads++;
      return reads === 1 ? 4 : 0;
    },
  });

  assert.doesNotThrow(() => braces(mixedNesting(4), options));
  assert.equal(reads, 1, 'maxDepth must be snapshotted once per public operation');
  assert.throws(() => braces(mixedNesting(5), { maxDepth: 4 }), /max depth \(4\)/);
  assert.throws(() => braces('{x}', { maxDepth: 0 }), /max depth \(0\)/);
});

test('hardened braces gates direct AST inputs before every recursive walker', () => {
  const braces = requireHardenedBracesFromConsumer();
  const maliciousAst = nestedAst(101);

  for (const operation of ['compile', 'expand', 'stringify']) {
    assert.throws(
      () => braces[operation](maliciousAst),
      /AST nesting depth exceeds max depth \(100\)/,
      `${operation} must reject a recursively deep caller-provided AST`,
    );
  }
});

test('hardened braces rejects deeply nested and cyclic value arrays', { timeout: 5_000 }, () => {
  const braces = requireHardenedBracesFromConsumer();

  for (const operation of ['compile', 'expand', 'stringify']) {
    assertSyntaxError(
      () => braces[operation](astWithValue(nestedValue(20_000))),
      /AST value nesting depth exceeds max depth \(100\)/,
      `${operation} must reject deeply nested value arrays without overflowing the stack`,
    );

    const cycle = [];
    cycle.push(cycle);
    assertSyntaxError(
      () => braces[operation](astWithValue(cycle)),
      /AST contains a recursive value array cycle/,
      `${operation} must reject cyclic value arrays without overflowing the stack`,
    );
  }
});

test('hardened braces rejects cyclic and excessive parent chains', { timeout: 5_000 }, () => {
  const braces = requireHardenedBracesFromConsumer();

  for (const operation of ['compile', 'expand', 'stringify']) {
    const selfParent = { type: 'group' };
    selfParent.parent = selfParent;
    assertSyntaxError(
      () =>
        braces[operation]({
          type: 'root',
          nodes: [{ type: 'text', value: 'x', parent: selfParent }],
        }),
      /AST contains a recursive parent cycle/,
      `${operation} must reject a self-referential parent`,
    );

    const firstParent = { type: 'group' };
    const secondParent = { type: 'group', parent: firstParent };
    firstParent.parent = secondParent;
    assertSyntaxError(
      () =>
        braces[operation]({
          type: 'root',
          nodes: [{ type: 'text', value: 'x', parent: firstParent }],
        }),
      /AST contains a recursive parent cycle/,
      `${operation} must reject a two-node parent cycle`,
    );

    let parent = { type: 'root' };
    for (let index = 0; index < 20_000; index++) {
      parent = { type: 'group', parent };
    }
    assertSyntaxError(
      () =>
        braces[operation]({
          type: 'root',
          nodes: [{ type: 'text', value: 'x', parent }],
        }),
      /AST parent chain exceeds max depth \(100\)/,
      `${operation} must reject an excessive parent chain without overflowing the stack`,
    );
  }
});

test('hardened braces rejects excessive AST breadth without iteration', { timeout: 2_000 }, () => {
  const braces = requireHardenedBracesFromConsumer();

  for (const operation of ['compile', 'expand', 'stringify']) {
    const sparseNodes = [];
    sparseNodes.length = 100_001;
    assertSyntaxError(
      () => braces[operation]({ type: 'root', nodes: sparseNodes }),
      /AST array item count exceeds safety limit \(100000\)/,
      `${operation} must reject excessive node-array breadth before iteration`,
    );

    const sparseValue = [];
    sparseValue.length = 100_001;
    assertSyntaxError(
      () => braces[operation](astWithValue(sparseValue)),
      /AST array item count exceeds safety limit \(100000\)/,
      `${operation} must reject excessive value-array breadth before iteration`,
    );

    assertSyntaxError(
      () =>
        braces[operation]({
          type: 'root',
          nodes: [
            { type: 'text', value: new Array(60_000) },
            { type: 'text', value: new Array(60_000) },
          ],
        }),
      /AST array item count exceeds safety limit \(100000\)/,
      `${operation} must enforce one total budget across node and value arrays`,
    );
  }
});

test('hardened braces resists stateful AST getters during actual traversal', {
  timeout: 5_000,
}, () => {
  const braces = requireHardenedBracesFromConsumer();

  for (const operation of ['compile', 'expand', 'stringify']) {
    let nodesReads = 0;
    const recursiveRoot = { type: 'root' };
    Object.defineProperty(recursiveRoot, 'nodes', {
      get() {
        nodesReads++;
        return nodesReads === 1 ? [] : [recursiveRoot];
      },
    });
    assertSyntaxError(
      () => braces[operation](recursiveRoot),
      /AST contains a recursive node cycle/,
      `${operation} must guard the nodes value used by its actual walker`,
    );
    assert.equal(nodesReads, 2, `${operation} must read nodes once per validation/traversal`);

    let valueReads = 0;
    const statefulValueNode = { type: 'text' };
    Object.defineProperty(statefulValueNode, 'value', {
      get() {
        valueReads++;
        return valueReads === 1 ? 'x' : nestedValue(20_000);
      },
    });
    assertSyntaxError(
      () => braces[operation]({ type: 'root', nodes: [statefulValueNode] }),
      /AST value nesting depth exceeds max depth \(100\)/,
      `${operation} must guard the value used by its actual walker`,
    );
    assert.equal(valueReads, 2, `${operation} must read value once per validation/traversal`);

    let proxyValueReads = 0;
    const proxiedValueNode = new Proxy(
      { type: 'text' },
      {
        get(target, property, receiver) {
          if (property === 'value') {
            proxyValueReads++;
            return proxyValueReads === 1 ? 'x' : nestedValue(20_000);
          }
          return Reflect.get(target, property, receiver);
        },
      },
    );
    assertSyntaxError(
      () => braces[operation]({ type: 'root', nodes: [proxiedValueNode] }),
      /AST value nesting depth exceeds max depth \(100\)/,
      `${operation} must guard a stateful Proxy value used by its actual walker`,
    );
    assert.equal(
      proxyValueReads,
      2,
      `${operation} must read a proxied value once per validation/traversal`,
    );

    let nodeIndexReads = 0;
    const statefulNodes = [];
    const indexedRoot = { type: 'root', nodes: statefulNodes };
    Object.defineProperty(statefulNodes, 0, {
      configurable: true,
      get() {
        nodeIndexReads++;
        return nodeIndexReads === 1 ? { type: 'text', value: 'x' } : indexedRoot;
      },
    });
    statefulNodes.length = 1;
    assertSyntaxError(
      () => braces[operation](indexedRoot),
      /AST contains a recursive node cycle/,
      `${operation} must guard the node returned by a stateful array index`,
    );
    assert.equal(nodeIndexReads, 2, `${operation} must read each node index once per pass`);

    let valueIndexReads = 0;
    const statefulValue = [];
    Object.defineProperty(statefulValue, 0, {
      configurable: true,
      get() {
        valueIndexReads++;
        return valueIndexReads === 1 ? 'x' : nestedValue(20_000);
      },
    });
    statefulValue.length = 1;
    assertSyntaxError(
      () => braces[operation](astWithValue(statefulValue)),
      /AST value nesting depth exceeds max depth \(100\)/,
      `${operation} must snapshot the validated value returned by a stateful array index`,
    );
    assert.equal(valueIndexReads, 2, `${operation} must read each value index once per pass`);

    let growingValueReads = 0;
    const growingValue = ['x'];
    Object.defineProperty(growingValue, 0, {
      configurable: true,
      get() {
        growingValueReads++;
        if (growingValueReads === 2) growingValue.length = 1_000_000_000;
        return 'x';
      },
    });
    try {
      assert.doesNotThrow(
        () => braces[operation](astWithValue(growingValue)),
        `${operation} must use the value-array length captured before reading an index`,
      );
      assert.equal(growingValueReads, 2);
    } finally {
      growingValue.length = 1;
    }

    let growingNodesReads = 0;
    const growingNodes = [{ type: 'text', value: 'x' }];
    Object.defineProperty(growingNodes, 0, {
      configurable: true,
      get() {
        growingNodesReads++;
        if (growingNodesReads === 2) growingNodes.length = 1_000_000_000;
        return { type: 'text', value: 'x' };
      },
    });
    try {
      assert.doesNotThrow(
        () => braces[operation]({ type: 'root', nodes: growingNodes }),
        `${operation} must use the node-array length captured before reading an index`,
      );
      assert.equal(growingNodesReads, 2);
    } finally {
      growingNodes.length = 1;
    }
  }

  let parentReads = 0;
  let typeReads = 0;
  const group = { nodes: [{ type: 'text', value: 'x' }] };
  const root = { type: 'root', nodes: [group] };
  Object.defineProperty(group, 'type', {
    get() {
      typeReads++;
      return 'group';
    },
  });
  Object.defineProperty(group, 'parent', {
    get() {
      parentReads++;
      return parentReads === 1 ? root : group;
    },
  });
  assertSyntaxError(
    () => braces.expand(root),
    /AST contains a recursive parent cycle/,
    'expand must guard stateful parent/type properties in its actual parent traversal',
  );
  assert.equal(parentReads, 2, 'expand must read a parent once per validation/traversal');
  assert.equal(typeReads, 2, 'expand must snapshot a node type once per validation/traversal');
});

test('hardened braces rejects untrusted recursive parent queues', { timeout: 2_000 }, () => {
  const braces = requireHardenedBracesFromConsumer();
  const recursiveQueue = [];
  recursiveQueue.push(recursiveQueue, recursiveQueue);
  const foreignParent = { type: 'root', queue: recursiveQueue };
  const group = {
    type: 'group',
    parent: foreignParent,
    nodes: [{ type: 'text', value: 'x' }],
  };
  assertSyntaxError(
    () => braces.expand({ type: 'root', nodes: [group] }),
    /AST parent chain leaves the active traversal/,
    'expand must not consume a queue from outside the active containment tree',
  );

  let queueReads = 0;
  const root = { type: 'root', nodes: [{ type: 'text', value: 'x' }] };
  Object.defineProperty(root, 'queue', {
    get() {
      queueReads++;
      return recursiveQueue;
    },
    set() {},
  });
  assert.deepEqual(braces.expand(root), ['x']);
  assert.equal(queueReads, 0, 'expand must keep its queues outside the caller-supplied AST');
});

test('hardened braces ignores concat-spreadable non-array values', { timeout: 2_000 }, () => {
  const braces = requireHardenedBracesFromConsumer();
  const spreadable = {
    0: 'x',
    length: 1_000_000_000,
    [Symbol.isConcatSpreadable]: true,
  };
  assert.deepEqual(braces.expand(astWithValue(spreadable)), ['[object Object]']);
});

test('hardened braces snapshots stateful range values', { timeout: 2_000 }, () => {
  const braces = requireHardenedBracesFromConsumer();
  for (const operation of ['compile', 'expand']) {
    let valueReads = 0;
    const text = { type: 'text' };
    Object.defineProperty(text, 'value', {
      get() {
        valueReads++;
        return valueReads === 1 ? '1' : nestedValue(20_000);
      },
    });
    const ast = {
      type: 'root',
      nodes: [{ type: 'brace', ranges: 1, nodes: [text] }],
    };
    assertSyntaxError(
      () => braces[operation](ast),
      /AST value nesting depth exceeds max depth \(100\)/,
      `${operation} must snapshot range values used by reduce`,
    );
    assert.equal(valueReads, 2, `${operation} must read a range value once per pass`);
  }
});
