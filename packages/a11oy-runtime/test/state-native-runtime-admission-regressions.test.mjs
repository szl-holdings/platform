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

function prepareEpoch(manager, epochId) {
  const policyDigest = digestObject({ policy: epochId });
  manager.prepare({
    epochId,
    tenantId: 'tenant_a',
    route: 'state.test',
    modelId: 'model-a',
    modelRevision: 'rev-a',
    engineId: 'engine-a',
    engineVersion: '1.0.0',
    tokenizerDigest: digestObject({ tokenizer: epochId }),
    layoutDigest: digestObject({ layout: epochId }),
    adapterSetDigest: digestObject({ adapters: [] }),
    verifierSetDigest: digestObject({ verifiers: [] }),
    promptBundleDigest: digestObject({ prompt: epochId }),
    policyDigest,
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  });
  return {
    policyDigest,
    compatibility: {
      schemaDigest: digestObject({ schema: 'state.test/v1' }),
      policyDigest,
      cognitiveEpoch: epochId,
    },
  };
}

function activateEpoch(manager, epochId) {
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
}

function requestFor({ actionId, kernelId, compatibility, epochId }) {
  const provisional = {
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
      decision: { effect: 'allow', reason: 'Bounded admission policy allows execution.' },
      allowedSensitivities: ['internal'],
    },
    kernelId,
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    inputCapsuleIds: [],
    inputCompatibility: compatibility,
    parameters: {},
    budget: {
      maxRuntimeMs: 2_000,
      maxInputBytes: 4096,
      maxOutputBytes: 4096,
      maxStateWrites: 1,
    },
    epochId,
  };
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

test('canonical digests reject structured non-JSON object types', () => {
  for (const value of [
    new Map([['material', 1]]),
    new Set(['material']),
    /material/u,
    new Date('2026-08-11T00:00:00.000Z'),
    Uint8Array.from([1]),
  ]) {
    assert.throws(
      () => digestObject({ parameters: { value } }),
      /Canonical JSON supports only plain objects and arrays/,
    );
  }

  assert.doesNotThrow(() => digestObject({ parameters: { value: '2026-08-11T00:00:00.000Z' } }));
  assert.doesNotThrow(() => digestObject({ parameters: { value: { $bytes: 'AQ==' } } }));
});

test('runtime rejects blank action identifiers before kernel execution', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_blank_action_id');
  activateEpoch(manager, 'epoch_blank_action_id');
  const receiptKeys = generateKeyPairSync('ed25519');
  const receiptLedger = [];
  let executions = 0;

  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'receipt-key', privateKey: receiptKeys.privateKey },
        receiptWriter: async (receipt) => receiptLedger.push(receipt),
      },
    });
    runtime.register({
      kernelId: 'state.blank-action-id',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => {
        executions += 1;
        return [];
      },
    });

    await assert.rejects(
      runtime.execute(
        requestFor({
          actionId: '   ',
          kernelId: 'state.blank-action-id',
          compatibility: active.compatibility,
          epochId: 'epoch_blank_action_id',
        }),
      ),
      expectCode('INVALID_INPUT'),
    );
    assert.equal(executions, 0);
    assert.equal(receiptLedger.length, 0);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('runtime captures receipt signer and writer dependencies at construction', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_receipt_dependencies');
  activateEpoch(manager, 'epoch_receipt_dependencies');
  const originalKeys = generateKeyPairSync('ed25519');
  const replacementKeys = generateKeyPairSync('ed25519');
  const originalLedger = [];
  const replacementLedger = [];
  let releaseExecution;
  const executionGate = new Promise((resolve) => {
    releaseExecution = resolve;
  });
  const config = {
    receiptSigner: { keyId: 'original-key', privateKey: originalKeys.privateKey },
    receiptWriter: async (receipt) => originalLedger.push(receipt),
  };

  try {
    const runtime = new AlloyKernelRuntime({ stateBus: bus, epochManager: manager, config });
    runtime.register({
      kernelId: 'state.receipt-dependencies',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => {
        await executionGate;
        return [];
      },
    });

    const execution = runtime.execute(
      requestFor({
        actionId: 'runtime-action-receipt-dependencies',
        kernelId: 'state.receipt-dependencies',
        compatibility: active.compatibility,
        epochId: 'epoch_receipt_dependencies',
      }),
    );
    config.receiptSigner = { keyId: 'replacement-key', privateKey: replacementKeys.privateKey };
    config.receiptWriter = async (receipt) => replacementLedger.push(receipt);
    releaseExecution();

    const result = await execution;
    assert.equal(originalLedger.length, 1);
    assert.equal(replacementLedger.length, 0);
    assert.equal(result.receipt.signature.keyId, 'original-key');
    assert.equal(verifyKernelExecutionReceipt(result.receipt, originalKeys.publicKey), true);
    assert.equal(verifyKernelExecutionReceipt(result.receipt, replacementKeys.publicKey), false);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('epoch validation rejects truthy non-boolean results before state transition', () => {
  const manager = new CognitiveEpochManager();
  prepareEpoch(manager, 'epoch_malformed_check');
  assert.throws(
    () =>
      manager.validate('epoch_malformed_check', [
        { name: 'self-test', passed: 'false', detail: 'This must not be accepted.' },
      ]),
    expectCode('INVALID_INPUT'),
  );
  assert.equal(manager.require('epoch_malformed_check').state, 'PREPARED');
});
