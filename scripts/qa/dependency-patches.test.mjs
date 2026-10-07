import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const VIRTUAL_STORE = path.join(ROOT, 'node_modules', '.pnpm');
const require = createRequire(import.meta.url);
const BRACES_PATCH_HASH = 'c056b5c1123a999cfcaa5ad56c70e69a1120e186c410ee091a1f86e941411cf9';

function requirePatchedPackage(packageName, version, patchHash) {
  const expected = `${packageName}@${version}_patch_hash=${patchHash}`;
  const matches = readdirSync(VIRTUAL_STORE).filter((entry) => entry === expected);
  assert.deepEqual(matches, [expected], `expected exactly one installed ${expected}`);
  return require(path.join(VIRTUAL_STORE, expected, 'node_modules', packageName));
}

function requirePatchedBracesFromConsumer(patchHash) {
  const direct = requirePatchedPackage('braces', '3.0.3', patchHash);
  const consumerRequire = createRequire(
    path.join(VIRTUAL_STORE, 'micromatch@4.0.8', 'node_modules', 'micromatch', 'package.json'),
  );
  const resolved = consumerRequire('braces');
  assert.equal(resolved, direct, 'micromatch must resolve the exact patched braces instance');
  return resolved;
}

function requirePatchedNodeForgeFromConsumer(patchHash) {
  const direct = requirePatchedPackage('node-forge', '1.4.0', patchHash);
  const consumerRequire = createRequire(
    path.join(
      VIRTUAL_STORE,
      '@expo+code-signing-certificates@0.0.6',
      'node_modules',
      '@expo',
      'code-signing-certificates',
      'package.json',
    ),
  );
  const resolved = consumerRequire('node-forge');
  assert.equal(
    resolved,
    direct,
    '@expo/code-signing-certificates must resolve the exact patched node-forge instance',
  );
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

test('braces patch rejects excessive recursive AST nesting', () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);

  const nested = (open, close, depth) => `${open.repeat(depth)}x${close.repeat(depth)}`;
  assert.doesNotThrow(() => braces(nested('{', '}', 100)));
  assert.throws(() => braces(nested('{', '}', 101)), /nesting depth exceeds max depth \(100\)/);
  assert.throws(() => braces(nested('(', ')', 101)), /nesting depth exceeds max depth \(100\)/);
  assert.doesNotThrow(() => braces(mixedNesting(100)));
  assert.throws(() => braces(mixedNesting(101)), /nesting depth exceeds max depth \(100\)/);
});

test('braces patch enforces custom depth with a single stateful option read', () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);
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

test('braces patch gates direct AST inputs before every recursive walker', () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);
  const maliciousAst = nestedAst(101);

  for (const operation of ['compile', 'expand', 'stringify']) {
    assert.throws(
      () => braces[operation](maliciousAst),
      /AST nesting depth exceeds max depth \(100\)/,
      `${operation} must reject a recursively deep caller-provided AST`,
    );
  }
});

test('braces patch rejects deeply nested and cyclic value arrays', { timeout: 5_000 }, () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);

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

test('braces patch rejects cyclic and excessive parent chains', { timeout: 5_000 }, () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);

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

test('braces patch rejects excessive AST breadth without iteration', { timeout: 2_000 }, () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);

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

test('braces patch resists stateful AST getters during actual traversal', {
  timeout: 5_000,
}, () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);

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

test('braces patch rejects untrusted recursive parent queues', { timeout: 2_000 }, () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);
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

test('braces patch ignores concat-spreadable non-array values', { timeout: 2_000 }, () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);
  const spreadable = {
    0: 'x',
    length: 1_000_000_000,
    [Symbol.isConcatSpreadable]: true,
  };
  assert.deepEqual(braces.expand(astWithValue(spreadable)), ['[object Object]']);
});

test('braces patch snapshots stateful range values', { timeout: 2_000 }, () => {
  const braces = requirePatchedBracesFromConsumer(BRACES_PATCH_HASH);
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

test('node-forge patch rejects nested DigestAlgorithm garbage', () => {
  const forge = requirePatchedPackage(
    'node-forge',
    '1.4.0',
    'de8829eac6e09806b4b749a7221e7a2a62e6d88c796d38880d0f61bb2eb035ec',
  );
  const N = new forge.jsbn.BigInteger(
    'E932AC92252F585B3A80A4DD76A897C8B7652952FE788F6EC8DD640587A1EE56' +
      '47670A8AD4C2BE0F9FA6E49C605ADF77B5174230AF7BD50E5D6D6D6D28CCF0A8' +
      '86A514CC72E51D209CC772A52EF419F6A953F3135929588EBE9B351FCA61CED7' +
      '8F346FE00DBB6306E5C2A4C6DFC3779AF85AB417371CF34D8387B9B30AE46D7A' +
      '5FF5A655B8D8455F1B94AE736989D60A6F2FD5CADBFFBD504C5A756A2E6BB5CE' +
      'CC13BCA7503F6DF8B52ACE5C410997E98809DB4DC30D943DE4E812A47553DCE5' +
      '4844A78E36401D13F77DC650619FED88D8B3926E3D8E319C80C744779AC5D6AB' +
      'E252896950917476ECE5E8FC27D5F053D6018D91B502C4787558A002B9283DA7',
    16,
  );
  const e = new forge.jsbn.BigInteger('3');
  const signature = forge.util.binary.hex.decode(
    'a4ae63dd5e7712b78f4870d0f51e294df5503d4f16c5d27ae33370981fb57f0de49f' +
      '50f3d6a04666774cd984cd13972db9bf8e12bd294ef0ddc916c7c86cbae63efd7b6b' +
      '97885e69760c208a40f1aecc76a90d7af5145177efce1bb55807a8d05c20b1596753' +
      'ba710642fc9acdde6c160232654662c77cc4466c8257a38edb49f894e8845d0fd987' +
      'b857ced88f4b62505a080bd87ef700d35d392a6e8f6fde34250c50b86fae606cb551' +
      '215e8f4813239b77651d5565ad453698c071d48c31e8e526fb4a37610f64b3e1fb8e' +
      '5be5898e408ad08197a0947794a530b54f84485377ce4a7488ed485ce4e5e105dd89' +
      '698a472f390c3b1b76bc16b73276c4d1c81d',
  );
  const digest = forge.md.sha256.create();
  digest.update('hello world!');
  const publicKey = forge.pki.rsa.setPublicKey(N, e);

  assert.throws(
    () =>
      publicKey.verify(digest.digest().getBytes(), signature, undefined, {
        _parseAllDigestBytes: true,
        _skipPaddingChecks: true,
      }),
    /ASN\.1 object does not contain a valid RSASSA-PKCS1-v1_5 DigestInfo value/,
  );
});

function encodeDigestInfo(forge, digest, options = {}) {
  const oid = options.oid ?? forge.oids.sha256;
  const oidBytes = options.oidBytes ?? forge.asn1.oidToDer(oid).getBytes();
  const algorithm = [
    forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OID, false, oidBytes),
  ];

  if (options.parameters !== 'absent') {
    algorithm.push(
      forge.asn1.create(
        forge.asn1.Class.UNIVERSAL,
        forge.asn1.Type.NULL,
        false,
        options.parameters === 'nonempty-null' ? '\x00' : '',
      ),
    );
  }

  return forge.asn1
    .toDer(
      forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, [
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.SEQUENCE, true, algorithm),
        forge.asn1.create(forge.asn1.Class.UNIVERSAL, forge.asn1.Type.OCTETSTRING, false, digest),
      ]),
    )
    .getBytes();
}

test('node-forge patch accepts standards-compatible DER and rejects noncanonical encodings', () => {
  const forge = requirePatchedNodeForgeFromConsumer(
    'de8829eac6e09806b4b749a7221e7a2a62e6d88c796d38880d0f61bb2eb035ec',
  );
  const { privateKey, publicKey } = forge.pki.rsa.generateKeyPair({
    bits: 1024,
    e: 0x10001,
  });
  const signDigestInfo = (digestInfo) => forge.pki.rsa.encrypt(digestInfo, privateKey, 0x01);
  const sha256Digest = forge.md.sha256
    .create()
    .update('canonical DigestInfo regression')
    .digest()
    .getBytes();
  const shaWithNull = encodeDigestInfo(forge, sha256Digest);
  const shaWithoutParameters = encodeDigestInfo(forge, sha256Digest, { parameters: 'absent' });

  assert.equal(publicKey.verify(sha256Digest, signDigestInfo(shaWithNull)), true);
  assert.equal(publicKey.verify(sha256Digest, signDigestInfo(shaWithoutParameters)), true);

  const md5Digest = forge.md.md5.create().update('required NULL regression').digest().getBytes();
  const md5WithNull = encodeDigestInfo(forge, md5Digest, { oid: forge.oids.md5 });
  const md5WithoutParameters = encodeDigestInfo(forge, md5Digest, {
    oid: forge.oids.md5,
    parameters: 'absent',
  });
  assert.equal(publicKey.verify(md5Digest, signDigestInfo(md5WithNull)), true);
  assert.throws(
    () => publicKey.verify(md5Digest, signDigestInfo(md5WithoutParameters)),
    /Missing algorithm identifier NULL parameters/,
  );

  const nonemptyNull = encodeDigestInfo(forge, sha256Digest, {
    parameters: 'nonempty-null',
  });
  assert.throws(
    () => publicKey.verify(sha256Digest, signDigestInfo(nonemptyNull)),
    /ASN\.1 object does not contain a valid RSASSA-PKCS1-v1_5 DigestInfo value/,
  );

  const canonicalOid = forge.asn1.oidToDer(forge.oids.sha256).getBytes();
  const overlongOid = `${canonicalOid.slice(0, -1)}\x80${canonicalOid.slice(-1)}`;
  const noncanonicalOid = encodeDigestInfo(forge, sha256Digest, { oidBytes: overlongOid });
  assert.throws(
    () => publicKey.verify(sha256Digest, signDigestInfo(noncanonicalOid)),
    /canonical DER-encoded RSASSA-PKCS1-v1_5 DigestInfo/,
  );

  assert.ok(shaWithNull.charCodeAt(1) < 0x80, 'fixture must use a short-form outer length');
  const noncanonicalLength = `${shaWithNull[0]}\x81${shaWithNull.slice(1)}`;
  assert.throws(
    () => publicKey.verify(sha256Digest, signDigestInfo(noncanonicalLength)),
    /canonical DER-encoded RSASSA-PKCS1-v1_5 DigestInfo/,
  );

  const priorParameters = Object.getOwnPropertyDescriptor(Object.prototype, 'parameters');
  Object.defineProperty(Object.prototype, 'parameters', {
    configurable: true,
    value: 'polluted',
    writable: true,
  });
  try {
    assert.equal(publicKey.verify(sha256Digest, signDigestInfo(shaWithoutParameters)), true);
  } finally {
    if (priorParameters) {
      Object.defineProperty(Object.prototype, 'parameters', priorParameters);
    } else {
      Reflect.deleteProperty(Object.prototype, 'parameters');
    }
  }

  const inheritedTestFlags = Object.create({
    _parseAllDigestBytes: false,
    _skipPaddingChecks: true,
  });
  const digestInfoWithTrailingByte = `${shaWithNull}\x00`;
  assert.throws(
    () =>
      publicKey.verify(
        sha256Digest,
        signDigestInfo(digestInfoWithTrailingByte),
        undefined,
        inheritedTestFlags,
      ),
    /Unparsed DER bytes remain after ASN\.1 parsing/,
  );
});
