import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  AlloyKernelRuntime,
  AlloyStateBus,
  CognitiveEpochManager,
  StateNativeError,
  digestObject,
  kernelRequestDigest,
  verifyKernelExecutionReceipt,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

function prepareEpoch(manager, epochId, revision) {
  const policyDigest = digestObject({ policy: `policy-${revision}`, version: 1 });
  manager.prepare({
    epochId,
    tenantId: 'tenant_a',
    route: 'state.test',
    modelId: `model-${revision}`,
    modelRevision: revision,
    engineId: 'engine-a',
    engineVersion: '1.0.0',
    tokenizerDigest: digestObject({ tokenizer: revision }),
    layoutDigest: digestObject({ layout: revision }),
    adapterSetDigest: digestObject({ adapters: [revision] }),
    verifierSetDigest: digestObject({ verifiers: ['shape'] }),
    promptBundleDigest: digestObject({ prompt: revision }),
    policyDigest,
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  });
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
  return {
    policyDigest,
    compatibility: {
      schemaDigest: digestObject({ schema: 'state.test/v1' }),
      policyDigest,
      cognitiveEpoch: epochId,
    },
  };
}

function bindRequest(provisional) {
  return {
    ...provisional,
    authorization: {
      ...provisional.authorization,
      envelope: {
        ...provisional.authorization.envelope,
        argsDigest: kernelRequestDigest(provisional),
      },
    },
  };
}

function requestFor({ actionId, kernelId, compatibility, epochId, inputCapsuleIds = [], idempotencyKey }) {
  return bindRequest({
    authorization: {
      envelope: {
        schema: 'szl.governed-action/v1',
        actionId,
        toolName: kernelId,
        actorId: 'operator-a',
        tenantId: 'tenant_a',
        risk: 'medium',
        mutatesState: true,
        requestedAt: new Date().toISOString(),
        argsDigest: '',
      },
      decision: { effect: 'allow', reason: 'Bounded security conformance policy allows execution.' },
      allowedSensitivities: ['confidential'],
    },
    kernelId,
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    inputCapsuleIds,
    inputCompatibility: compatibility,
    parameters: {},
    budget: {
      maxRuntimeMs: 2_000,
      maxInputBytes: 4096,
      maxOutputBytes: 4096,
      maxStateWrites: 1,
    },
    epochId,
    idempotencyKey,
  });
}

test('a request pinned to a new epoch cannot consume state using an older epoch fingerprint', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const epochA = prepareEpoch(manager, 'epoch_a', 'rev-a');
  const input = await bus.put({
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    stateType: 'prompt',
    portability: 'P4',
    payload: Buffer.from('{"value":7}'),
    compatibility: epochA.compatibility,
    governance: {
      sensitivity: 'confidential',
      retentionClass: 'session',
      reusePolicy: 'same_session',
      evidenceTier: 'MEASURED',
    },
    provenance: { sourceActionId: 'seed_action', parentCapsuleIds: [] },
  });
  prepareEpoch(manager, 'epoch_b', 'rev-b');

  const { privateKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  let executed = false;
  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    runtime.register({
      kernelId: 'state.epoch-boundary',
      version: '1.0.0',
      kind: 'planning',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => {
        executed = true;
        return [];
      },
    });

    const request = requestFor({
      actionId: 'runtime-action-epoch-boundary',
      kernelId: 'state.epoch-boundary',
      compatibility: epochA.compatibility,
      epochId: 'epoch_b',
      inputCapsuleIds: [input.capsuleId],
      idempotencyKey: 'epoch-boundary-1',
    });

    await assert.rejects(runtime.execute(request), expectCode('COMPATIBILITY_MISMATCH'));
    await assert.rejects(runtime.execute(request), expectCode('COMPATIBILITY_MISMATCH'));
    assert.equal(executed, false);
    assert.equal(ledger.length, 2);
    assert.equal(ledger.every((receipt) => receipt.outcome === 'error'), true);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('failed epoch pinning never poisons an idempotency key as in-flight', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_active', 'rev-active');
  const { privateKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    runtime.register({
      kernelId: 'state.pin-boundary',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => [],
    });

    const request = requestFor({
      actionId: 'runtime-action-pin-boundary',
      kernelId: 'state.pin-boundary',
      compatibility: active.compatibility,
      epochId: 'epoch_missing',
      idempotencyKey: 'pin-boundary-1',
    });

    await assert.rejects(runtime.execute(request), expectCode('EPOCH_NOT_ACTIVE'));
    await assert.rejects(runtime.execute(request), expectCode('EPOCH_NOT_ACTIVE'));
    assert.equal(ledger.length, 0);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('same-tenant terminal receipts are serialized into one predecessor chain', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_receipt_chain', 'rev-chain');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  let writerCalls = 0;
  let releaseFirst;
  const firstWriterReleased = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let signalFirstWriter;
  const firstWriterEntered = new Promise((resolve) => {
    signalFirstWriter = resolve;
  });

  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => {
          writerCalls += 1;
          if (writerCalls === 1) {
            signalFirstWriter();
            await firstWriterReleased;
          }
          ledger.push(receipt);
        },
      },
    });
    runtime.register({
      kernelId: 'state.receipt-chain',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => [],
    });

    const firstRequest = requestFor({
      actionId: 'runtime-action-chain-1',
      kernelId: 'state.receipt-chain',
      compatibility: active.compatibility,
      epochId: 'epoch_receipt_chain',
    });
    const secondRequest = requestFor({
      actionId: 'runtime-action-chain-2',
      kernelId: 'state.receipt-chain',
      compatibility: active.compatibility,
      epochId: 'epoch_receipt_chain',
    });

    const firstExecution = runtime.execute(firstRequest);
    await firstWriterEntered;
    const secondExecution = runtime.execute(secondRequest);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(writerCalls, 1);

    releaseFirst();
    const [firstResult, secondResult] = await Promise.all([firstExecution, secondExecution]);
    assert.equal(writerCalls, 2);
    assert.equal(ledger.length, 2);
    assert.equal(firstResult.receipt.priorReceiptDigest, undefined);
    assert.equal(secondResult.receipt.priorReceiptDigest, firstResult.receipt.receiptDigest);
    assert.equal(verifyKernelExecutionReceipt(firstResult.receipt, publicKey), true);
    assert.equal(verifyKernelExecutionReceipt(secondResult.receipt, publicKey), true);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});
