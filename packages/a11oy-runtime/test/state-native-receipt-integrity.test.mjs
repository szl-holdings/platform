import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  AlloyStateBus,
  StateNativeError,
  canonicalJson,
  createKernelExecutionReceipt,
  digestObject,
  kernelRequestDigest,
  verifyKernelExecutionReceipt,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

test('canonical JSON preserves own prototype-named keys at every object depth', () => {
  const input = JSON.parse(
    '{"z":0,"__proto__":{"value":1},"constructor":"data","prototype":false,"nested":[{"__proto__":null}]}',
  );
  const encoded = canonicalJson(input);
  assert.equal(
    encoded,
    '{"__proto__":{"value":1},"constructor":"data","nested":[{"__proto__":null}],"prototype":false,"z":0}',
  );
  assert.deepEqual(JSON.parse(encoded), input);
  assert.equal(Object.getPrototypeOf(input), Object.prototype);

  const inherited = Object.create({ inherited: 'excluded' });
  inherited.own = 'included';
  assert.equal(canonicalJson(inherited), '{"own":"included"}');
  assert.equal(canonicalJson({ z: undefined, b: -0, a: 1 }), canonicalJson({ a: 1, b: 0 }));
});

test('object digests bind every JSON value stored in an own __proto__ key', () => {
  const values = [null, false, true, 0, 1, '', 'data', [], [1], {}, { value: 1 }];
  for (const wrap of [(value) => value, (value) => ({ nested: [value] })]) {
    const digests = values.map((value) => {
      const input = JSON.parse(`{"__proto__":${JSON.stringify(value)}}`);
      const digest = digestObject(wrap(input));
      assert.notEqual(digest, digestObject(wrap({})));
      return digest;
    });
    assert.equal(new Set(digests).size, values.length);
  }
});

test('kernel request authorization digests bind own __proto__ parameters', () => {
  const request = {
    kernelId: 'state.test',
    tenantId: 'tenant-a',
    sessionId: 'session-a',
    inputCapsuleIds: [],
    inputCompatibility: {
      schemaDigest: digestObject({ schema: 1 }),
      policyDigest: digestObject({ policy: 1 }),
      cognitiveEpoch: 'epoch-a',
    },
    budget: { maxRuntimeMs: 1_000, maxInputBytes: 0, maxOutputBytes: 0, maxStateWrites: 0 },
    parameters: JSON.parse('{"__proto__":{"destination":"original"}}'),
  };
  const authorizedDigest = kernelRequestDigest(request);
  assert.notEqual(
    kernelRequestDigest({
      ...request,
      parameters: JSON.parse('{"__proto__":{"destination":"changed"}}'),
    }),
    authorizedDigest,
  );
  assert.notEqual(kernelRequestDigest({ ...request, parameters: {} }), authorizedDigest);
});

test('compatibility digest fields must match the published lowercase SHA-256 shape', async () => {
  const key = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: key });
  try {
    await assert.rejects(
      bus.put({
        tenantId: 'tenant-a',
        sessionId: 'session-a',
        stateType: 'structured_memory',
        portability: 'P4',
        payload: Buffer.from('{"value":1}'),
        compatibility: {
          schemaDigest: 'x',
          policyDigest: digestObject({ policy: 'valid' }),
          cognitiveEpoch: 'epoch-a',
        },
        governance: {
          sensitivity: 'internal',
          retentionClass: 'session',
          reusePolicy: 'same_session',
          evidenceTier: 'MEASURED',
        },
        provenance: { sourceActionId: 'seed', parentCapsuleIds: [] },
      }),
      expectCode('COMPATIBILITY_MISMATCH'),
    );
    await assert.rejects(
      bus.put({
        tenantId: 'tenant-a',
        sessionId: 'session-a',
        stateType: 'structured_memory',
        portability: 'P4',
        payload: Buffer.from('{"value":2}'),
        compatibility: {
          schemaDigest: 'A'.repeat(64),
          policyDigest: digestObject({ policy: 'valid' }),
          cognitiveEpoch: 'epoch-a',
        },
        governance: {
          sensitivity: 'internal',
          retentionClass: 'session',
          reusePolicy: 'same_session',
          evidenceTier: 'MEASURED',
        },
        provenance: { sourceActionId: 'seed', parentCapsuleIds: [] },
      }),
      expectCode('COMPATIBILITY_MISMATCH'),
    );
    assert.equal(bus.listMetadata('tenant-a').length, 0);
  } finally {
    bus.dispose();
    key.fill(0);
  }
});

test('signed receipts deep-copy and freeze all nested mutable evidence', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const inputCapsuleIds = ['state-input'];
  const inputDigests = [digestObject({ input: 1 })];
  const outputCapsuleIds = ['state-output'];
  const outputDigests = [digestObject({ output: 1 })];
  const evidenceDigests = [digestObject({ evidence: 1 })];
  const budget = {
    maxRuntimeMs: 1_000,
    maxInputBytes: 4_096,
    maxOutputBytes: 4_096,
    maxStateWrites: 1,
  };

  const receipt = createKernelExecutionReceipt(
    {
      schema: 'szl.kernel-execution-receipt/v1',
      receiptId: 'receipt-a',
      actionId: 'action-a',
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      kernelId: 'state.test',
      kernelVersion: '1.0.0',
      kernelKind: 'verification',
      epochId: 'epoch-a',
      policyEffect: 'allow',
      policyReason: 'Bounded policy allows execution.',
      outcome: 'success',
      reason: 'Execution completed.',
      inputCapsuleIds,
      inputDigests,
      outputCapsuleIds,
      outputDigests,
      verifier: {
        passed: true,
        reason: 'Independent verification passed.',
        evidenceDigests,
      },
      budget,
      runtimeMs: 1,
      occurredAt: '2026-08-11T12:00:00.000Z',
    },
    { keyId: 'test-key', privateKey },
  );

  inputCapsuleIds[0] = 'tampered-input';
  inputDigests[0] = digestObject({ input: 2 });
  outputCapsuleIds[0] = 'tampered-output';
  outputDigests[0] = digestObject({ output: 2 });
  evidenceDigests[0] = digestObject({ evidence: 2 });
  budget.maxRuntimeMs = 9_999;

  assert.equal(receipt.inputCapsuleIds[0], 'state-input');
  assert.equal(receipt.outputCapsuleIds[0], 'state-output');
  assert.equal(receipt.budget.maxRuntimeMs, 1_000);
  assert.equal(verifyKernelExecutionReceipt(receipt, publicKey), true);
  // JSON parsers create an own __proto__ property; verification must bind it.
  const addedField = JSON.parse('{"__proto__":{"untrusted":"added"}}');
  assert.equal(verifyKernelExecutionReceipt({ ...receipt, ...addedField }, publicKey), false);
  assert.equal(
    verifyKernelExecutionReceipt(
      { ...receipt, budget: { ...receipt.budget, ...addedField } },
      publicKey,
    ),
    false,
  );
  assert.throws(() => receipt.inputDigests.push(digestObject({ input: 3 })), TypeError);
  assert.throws(
    () => receipt.verifier.evidenceDigests.push(digestObject({ evidence: 3 })),
    TypeError,
  );
  assert.throws(() => {
    receipt.budget.maxRuntimeMs = 3;
  }, TypeError);
});
