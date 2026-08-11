import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  AlloyStateBus,
  StateNativeError,
  createKernelExecutionReceipt,
  digestObject,
  verifyKernelExecutionReceipt,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

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
  assert.throws(() => receipt.inputDigests.push(digestObject({ input: 3 })), TypeError);
  assert.throws(() => receipt.verifier.evidenceDigests.push(digestObject({ evidence: 3 })), TypeError);
  assert.throws(() => {
    receipt.budget.maxRuntimeMs = 3;
  }, TypeError);
});
