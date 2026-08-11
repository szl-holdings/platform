import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  AlloyKernelRuntime,
  AlloyStateBus,
  CognitiveEpochManager,
  InMemoryStateTransportAdapter,
  ReasoningVault,
  StateNativeError,
  canonicalJson,
  digestObject,
  evaluateCompatibility,
  kernelRequestDigest,
  verifyKernelExecutionReceipt,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

function makeEpoch(epochId = 'epoch_test_1') {
  const policyDigest = digestObject({ policy: 'test-policy', version: 1 });
  const manager = new CognitiveEpochManager();
  manager.prepare({
    epochId,
    tenantId: 'tenant_a',
    route: 'state.test',
    modelId: 'model-a',
    modelRevision: 'rev-1',
    engineId: 'engine-a',
    engineVersion: '1.0.0',
    tokenizerDigest: digestObject({ tokenizer: 'a' }),
    layoutDigest: digestObject({ layout: 'a' }),
    adapterSetDigest: digestObject({ adapters: [] }),
    verifierSetDigest: digestObject({ verifiers: ['shape'] }),
    promptBundleDigest: digestObject({ prompt: 'a' }),
    policyDigest,
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  });
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
  return { manager, policyDigest, epochId };
}

function makeCompatibility(policyDigest, epochId) {
  return {
    schemaDigest: digestObject({ schema: 'state.test/v1' }),
    policyDigest,
    cognitiveEpoch: epochId,
  };
}

async function putInput(bus, compatibility, overrides = {}) {
  return bus.put({
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    stateType: 'prompt',
    portability: 'P4',
    payload: Buffer.from(JSON.stringify({ value: 7 })),
    compatibility,
    governance: {
      sensitivity: 'confidential',
      retentionClass: 'session',
      reusePolicy: 'same_session',
      evidenceTier: 'MEASURED',
    },
    provenance: { sourceActionId: 'seed_action', parentCapsuleIds: [] },
    ...overrides,
  });
}

test('canonical JSON and compatibility tiers are deterministic and fail closed', () => {
  assert.equal(canonicalJson({ z: 1, a: { y: 2, x: 1 } }), '{"a":{"x":1,"y":2},"z":1}');
  const stored = { schemaDigest: 'schema-a', policyDigest: 'policy-a', cognitiveEpoch: 'epoch-a' };
  assert.equal(evaluateCompatibility('P4', stored, { ...stored }).compatible, true);
  const mismatch = evaluateCompatibility('P4', stored, { ...stored, policyDigest: 'policy-b' });
  assert.equal(mismatch.compatible, false);
  assert.deepEqual(mismatch.mismatches.map((item) => item.field), ['policyDigest']);
});

test('Alloy State Bus encrypts, binds, reuses, transports, and crypto-shreds state', async () => {
  const { policyDigest, epochId } = makeEpoch();
  const compatibility = makeCompatibility(policyDigest, epochId);
  const firstKey = randomBytes(32);
  const secondKey = randomBytes(32);
  const first = new AlloyStateBus({ masterKey: firstKey });
  const second = new AlloyStateBus({ masterKey: secondKey });
  try {
    const capsule = await putInput(first, compatibility, { idempotencyKey: 'input-1' });
    const replay = await putInput(first, compatibility, { idempotencyKey: 'input-1' });
    assert.equal(replay.capsuleId, capsule.capsuleId);

    await assert.rejects(
      putInput(first, compatibility, {
        idempotencyKey: 'input-1',
        payload: Buffer.from(JSON.stringify({ value: 8 })),
      }),
      expectCode('DIVERGENT_REPLAY'),
    );
    await assert.rejects(
      first.get(capsule.capsuleId, {
        tenantId: 'tenant_b',
        sessionId: 'session_a',
        actionId: 'read_action',
        compatibility,
        allowedSensitivities: ['confidential'],
      }),
      expectCode('TENANT_MISMATCH'),
    );
    await assert.rejects(
      first.get(capsule.capsuleId, {
        tenantId: 'tenant_a',
        sessionId: 'session_a',
        actionId: 'read_action',
        compatibility: { ...compatibility, policyDigest: 'wrong' },
        allowedSensitivities: ['confidential'],
      }),
      expectCode('COMPATIBILITY_MISMATCH'),
    );

    await assert.rejects(
      first.get(capsule.capsuleId, {
        tenantId: 'tenant_a',
        sessionId: 'session_a',
        actionId: 'read_action',
        compatibility,
        allowedSensitivities: ['public'],
      }),
      expectCode('REUSE_DENIED'),
    );

    const read = await first.get(capsule.capsuleId, {
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      actionId: 'read_action',
      compatibility,
      allowedSensitivities: ['confidential'],
    });
    assert.deepEqual(JSON.parse(Buffer.from(read.payload).toString('utf8')), { value: 7 });

    const transport = new InMemoryStateTransportAdapter('test-transport');
    const exported = await first.exportTo(
      capsule.capsuleId,
      {
        tenantId: 'tenant_a',
        sessionId: 'session_a',
        actionId: 'transport_action',
        compatibility,
        allowedSensitivities: ['confidential'],
      },
      transport,
    );
    assert.equal(exported.direction, 'EXPORT');
    const imported = await second.importFrom(capsule.capsuleId, 'tenant_a', transport);
    assert.equal(imported.capsule.capsuleId, capsule.capsuleId);
    const importedRead = await second.get(capsule.capsuleId, {
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      actionId: 'read_import',
      compatibility,
      allowedSensitivities: ['confidential'],
    });
    assert.equal(Buffer.from(importedRead.payload).toString('utf8'), '{"value":7}');

    await first.cryptoShred(capsule.capsuleId, 'tenant_a', 'Retention test complete.');
    await assert.rejects(
      first.get(capsule.capsuleId, {
        tenantId: 'tenant_a',
        sessionId: 'session_a',
        actionId: 'read_action',
        compatibility,
        allowedSensitivities: ['confidential'],
      }),
      expectCode('SHREDDED'),
    );
  } finally {
    first.dispose();
    second.dispose();
    firstKey.fill(0);
    secondKey.fill(0);
  }
});

test('cognitive epochs pin requests and retire only after outstanding leases drain', () => {
  const { manager, epochId } = makeEpoch('epoch_a');
  const lease = manager.pin('tenant_a', 'state.test', epochId);
  const nextPolicy = digestObject({ policy: 'next' });
  manager.prepare({
    epochId: 'epoch_b',
    tenantId: 'tenant_a',
    route: 'state.test',
    modelId: 'model-b',
    modelRevision: 'rev-2',
    engineId: 'engine-a',
    engineVersion: '1.0.0',
    tokenizerDigest: digestObject({ tokenizer: 'b' }),
    layoutDigest: digestObject({ layout: 'b' }),
    adapterSetDigest: digestObject({ adapters: ['b'] }),
    verifierSetDigest: digestObject({ verifiers: ['shape'] }),
    promptBundleDigest: digestObject({ prompt: 'b' }),
    policyDigest: nextPolicy,
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  });
  manager.validate('epoch_b', [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate('epoch_b');
  assert.equal(manager.require('epoch_a').state, 'DRAINING');
  lease.release();
  assert.equal(manager.require('epoch_a').state, 'RETIRED');
  assert.equal(manager.active('tenant_a', 'state.test')?.epochId, 'epoch_b');
});

test('Reasoning Vault enforces exact binding and refuses ambiguous replay', () => {
  const key = randomBytes(32);
  const vault = new ReasoningVault({ masterKey: key, maxEntryBytes: 1024, maxTenantBytes: 4096 });
  try {
    const entry = vault.store({
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      modelId: 'provider-model',
      modelRevision: 'exact-revision',
      cognitiveEpoch: 'epoch_a',
      providerRequestId: 'provider-request-1',
      payload: Buffer.from('opaque-continuity-state'),
      ttlMs: 60_000,
      idempotencyKey: 'vault-1',
    });
    assert.throws(
      () =>
        vault.checkout({
          entryId: entry.entryId,
          tenantId: 'tenant_a',
          sessionId: 'session_a',
          modelId: 'provider-model',
          modelRevision: 'wrong-revision',
          cognitiveEpoch: 'epoch_a',
        }),
      expectCode('COMPATIBILITY_MISMATCH'),
    );
    const checkedOut = vault.checkout({
      entryId: entry.entryId,
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      modelId: 'provider-model',
      modelRevision: 'exact-revision',
      cognitiveEpoch: 'epoch_a',
    });
    assert.equal(Buffer.from(checkedOut.payload).toString('utf8'), 'opaque-continuity-state');
    vault.markIndeterminate(entry.entryId, 'tenant_a', 'Provider connection ended after dispatch.');
    assert.throws(
      () =>
        vault.checkout({
          entryId: entry.entryId,
          tenantId: 'tenant_a',
          sessionId: 'session_a',
          modelId: 'provider-model',
          modelRevision: 'exact-revision',
          cognitiveEpoch: 'epoch_a',
        }),
      expectCode('INDETERMINATE'),
    );
    assert.equal(vault.cryptoShred(entry.entryId, 'tenant_a', 'Test teardown.').state, 'SHREDDED');
  } finally {
    vault.dispose();
    key.fill(0);
  }
});

test('Alloy Kernel Runtime executes a verified epoch-pinned state transition and signs its receipt', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const { manager, policyDigest, epochId } = makeEpoch('epoch_runtime');
  const compatibility = makeCompatibility(policyDigest, epochId);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  try {
    const input = await putInput(bus, compatibility, { idempotencyKey: 'runtime-input' });
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    runtime.register({
      kernelId: 'state.increment',
      version: '1.0.0',
      kind: 'planning',
      route: 'state.test',
      requiresVerification: true,
      execute: async (kernelInput) => {
        const parsed = JSON.parse(Buffer.from(kernelInput.capsules[0].payload).toString('utf8'));
        return [
          {
            stateType: 'structured_memory',
            portability: 'P4',
            payload: Buffer.from(JSON.stringify({ value: parsed.value + 1 })),
          },
        ];
      },
      verify: async (output) => {
        const parsed = JSON.parse(Buffer.from(output[0].payload).toString('utf8'));
        return {
          passed: parsed.value === 8,
          reason: parsed.value === 8 ? 'Increment invariant passed.' : 'Increment invariant failed.',
          evidenceDigests: [digestObject(parsed)],
        };
      },
    });

    const provisional = {
      authorization: {
        envelope: {
          schema: 'szl.governed-action/v1',
          actionId: 'runtime-action-1',
          toolName: 'state.increment',
          actorId: 'operator-a',
          tenantId: 'tenant_a',
          risk: 'low',
          mutatesState: true,
          requestedAt: new Date().toISOString(),
          argsDigest: '',
        },
        decision: { effect: 'allow', reason: 'Bounded test policy allows execution.' },
        allowedSensitivities: ['confidential'],
      },
      kernelId: 'state.increment',
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      inputCapsuleIds: [input.capsuleId],
      inputCompatibility: compatibility,
      parameters: {},
      budget: {
        maxRuntimeMs: 2_000,
        maxInputBytes: 4096,
        maxOutputBytes: 4096,
        maxStateWrites: 1,
      },
      epochId,
      idempotencyKey: 'runtime-execution-1',
    };
    const request = {
      ...provisional,
      authorization: {
        ...provisional.authorization,
        envelope: {
          ...provisional.authorization.envelope,
          argsDigest: kernelRequestDigest(provisional),
        },
      },
    };
    const result = await runtime.execute(request);
    assert.equal(result.outputs.length, 1);
    assert.equal(result.receipt.outcome, 'success');
    assert.equal(verifyKernelExecutionReceipt(result.receipt, publicKey), true);
    assert.equal(ledger.length, 1);
    const output = await bus.get(result.outputs[0].capsuleId, {
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      actionId: 'runtime-action-1',
      compatibility,
      allowedSensitivities: ['confidential'],
    });
    assert.deepEqual(JSON.parse(Buffer.from(output.payload).toString('utf8')), { value: 8 });

    const replay = await runtime.execute(request);
    assert.equal(replay.receipt.receiptId, result.receipt.receiptId);
    assert.equal(ledger.length, 1);
    await assert.rejects(
      runtime.execute({ ...request, parameters: { divergent: true } }),
      expectCode('DIVERGENT_REPLAY'),
    );
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('policy denial writes a signed blocked receipt before any kernel execution', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const { manager, policyDigest, epochId } = makeEpoch('epoch_policy_block');
  const compatibility = makeCompatibility(policyDigest, epochId);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  let executed = false;
  try {
    const input = await putInput(bus, compatibility);
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    runtime.register({
      kernelId: 'state.policy-blocked',
      version: '1.0.0',
      kind: 'policy',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => {
        executed = true;
        return [];
      },
    });
    const provisional = {
      authorization: {
        envelope: {
          schema: 'szl.governed-action/v1',
          actionId: 'runtime-action-policy-block',
          toolName: 'state.policy-blocked',
          actorId: 'operator-a',
          tenantId: 'tenant_a',
          risk: 'medium',
          mutatesState: true,
          requestedAt: new Date().toISOString(),
          argsDigest: '',
        },
        decision: { effect: 'block', reason: 'Test policy denies this action.' },
        allowedSensitivities: ['confidential'],
      },
      kernelId: 'state.policy-blocked',
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      inputCapsuleIds: [input.capsuleId],
      inputCompatibility: compatibility,
      parameters: {},
      budget: {
        maxRuntimeMs: 2_000,
        maxInputBytes: 4096,
        maxOutputBytes: 4096,
        maxStateWrites: 1,
      },
      epochId,
      idempotencyKey: 'policy-block',
    };
    const request = {
      ...provisional,
      authorization: {
        ...provisional.authorization,
        envelope: {
          ...provisional.authorization.envelope,
          argsDigest: kernelRequestDigest(provisional),
        },
      },
    };
    await assert.rejects(runtime.execute(request), expectCode('POLICY_BLOCKED'));
    assert.equal(executed, false);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'blocked');
    assert.equal(verifyKernelExecutionReceipt(ledger[0], publicKey), true);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('kernel failure writes a signed error receipt and becomes non-retriable', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const { manager, policyDigest, epochId } = makeEpoch('epoch_kernel_error');
  const compatibility = makeCompatibility(policyDigest, epochId);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  try {
    const input = await putInput(bus, compatibility);
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    runtime.register({
      kernelId: 'state.error',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => {
        throw new Error('deterministic kernel failure');
      },
    });
    const provisional = {
      authorization: {
        envelope: {
          schema: 'szl.governed-action/v1',
          actionId: 'runtime-action-error',
          toolName: 'state.error',
          actorId: 'operator-a',
          tenantId: 'tenant_a',
          risk: 'low',
          mutatesState: true,
          requestedAt: new Date().toISOString(),
          argsDigest: '',
        },
        decision: { effect: 'allow', reason: 'Test policy allows execution.' },
        allowedSensitivities: ['confidential'],
      },
      kernelId: 'state.error',
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      inputCapsuleIds: [input.capsuleId],
      inputCompatibility: compatibility,
      parameters: {},
      budget: {
        maxRuntimeMs: 2_000,
        maxInputBytes: 4096,
        maxOutputBytes: 4096,
        maxStateWrites: 1,
      },
      epochId,
      idempotencyKey: 'kernel-error',
    };
    const request = {
      ...provisional,
      authorization: {
        ...provisional.authorization,
        envelope: {
          ...provisional.authorization.envelope,
          argsDigest: kernelRequestDigest(provisional),
        },
      },
    };
    await assert.rejects(runtime.execute(request), /deterministic kernel failure/);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'error');
    assert.equal(verifyKernelExecutionReceipt(ledger[0], publicKey), true);
    await assert.rejects(runtime.execute(request), expectCode('INDETERMINATE'));
    assert.equal(ledger.length, 1);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('receipt persistence failure quarantines produced state and blocks release', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const { manager, policyDigest, epochId } = makeEpoch('epoch_receipt_failure');
  const compatibility = makeCompatibility(policyDigest, epochId);
  const { privateKey } = generateKeyPairSync('ed25519');
  try {
    const input = await putInput(bus, compatibility);
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async () => {
          throw new Error('ledger unavailable');
        },
      },
    });
    runtime.register({
      kernelId: 'state.fail-receipt',
      version: '1.0.0',
      kind: 'verification',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => [
        {
          stateType: 'structured_memory',
          portability: 'P4',
          payload: Buffer.from('{"release":false}'),
        },
      ],
    });
    const provisional = {
      authorization: {
        envelope: {
          schema: 'szl.governed-action/v1',
          actionId: 'runtime-action-receipt-failure',
          toolName: 'state.fail-receipt',
          actorId: 'operator-a',
          tenantId: 'tenant_a',
          risk: 'low',
          mutatesState: true,
          requestedAt: new Date().toISOString(),
          argsDigest: '',
        },
        decision: { effect: 'allow', reason: 'Test.' },
        allowedSensitivities: ['confidential'],
      },
      kernelId: 'state.fail-receipt',
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      inputCapsuleIds: [input.capsuleId],
      inputCompatibility: compatibility,
      parameters: {},
      budget: {
        maxRuntimeMs: 2_000,
        maxInputBytes: 4096,
        maxOutputBytes: 4096,
        maxStateWrites: 1,
      },
      epochId,
      idempotencyKey: 'receipt-failure',
    };
    const request = {
      ...provisional,
      authorization: {
        ...provisional.authorization,
        envelope: {
          ...provisional.authorization.envelope,
          argsDigest: kernelRequestDigest(provisional),
        },
      },
    };
    await assert.rejects(runtime.execute(request), expectCode('RECEIPT_WRITE_FAILED'));
    const quarantined = bus.listMetadata('tenant_a').find((capsule) => capsule.stateType === 'structured_memory');
    assert.ok(quarantined);
    assert.equal(quarantined.revocationStatus, 'QUARANTINED');
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});
