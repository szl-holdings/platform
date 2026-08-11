import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  AlloyKernelRuntime,
  AlloyStateBus,
  CognitiveEpochManager,
  StateNativeError,
  canonicalJson,
  digestObject,
  kernelRequestDigest,
  verifyKernelExecutionReceipt,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

function epochSpec(epochId, revision) {
  return {
    epochId,
    tenantId: 'tenant_a',
    route: 'state.review',
    modelId: `model-${revision}`,
    modelRevision: revision,
    engineId: 'engine-a',
    engineVersion: '1.0.0',
    tokenizerDigest: digestObject({ tokenizer: revision }),
    layoutDigest: digestObject({ layout: revision }),
    adapterSetDigest: digestObject({ adapters: [revision] }),
    verifierSetDigest: digestObject({ verifiers: ['review'] }),
    promptBundleDigest: digestObject({ prompt: revision }),
    policyDigest: digestObject({ policy: revision }),
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  };
}

function activateEpoch(manager, epochId, revision) {
  const spec = epochSpec(epochId, revision);
  manager.prepare(spec);
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
  return {
    epochId,
    compatibility: {
      schemaDigest: digestObject({ schema: 'state.review/v1' }),
      policyDigest: spec.policyDigest,
      cognitiveEpoch: epochId,
    },
  };
}

function requestFor(kernelId, epoch) {
  const provisional = {
    authorization: {
      envelope: {
        schema: 'szl.governed-action/v1',
        actionId: 'review-hardening-action',
        toolName: kernelId,
        actorId: 'operator-a',
        tenantId: 'tenant_a',
        risk: 'medium',
        mutatesState: true,
        requestedAt: new Date().toISOString(),
        argsDigest: '',
      },
      decision: { effect: 'allow', reason: 'Review hardening test.' },
      allowedSensitivities: ['public', 'internal'],
    },
    kernelId,
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    inputCapsuleIds: [],
    inputCompatibility: epoch.compatibility,
    parameters: {},
    budget: {
      maxRuntimeMs: 2_000,
      maxInputBytes: 4_096,
      maxOutputBytes: 4_096,
      maxStateWrites: 1,
    },
    epochId: epoch.epochId,
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

test('canonical request material rejects non-plain structured-cloneable objects', () => {
  for (const value of [new Map([['scope', 'alpha']]), new Set(['alpha']), /alpha/u]) {
    assert.throws(
      () => canonicalJson({ value }),
      (error) => error instanceof TypeError && /does not support/u.test(error.message),
    );
  }
  const sparse = [];
  sparse.length = 1;
  assert.throws(
    () => canonicalJson({ sparse }),
    (error) => error instanceof TypeError && /sparse arrays/u.test(error.message),
  );
});

test('epoch validation requires one-read strict boolean evidence', () => {
  const manager = new CognitiveEpochManager();
  const invalidEpochId = 'epoch_review_invalid';
  manager.prepare(epochSpec(invalidEpochId, 'invalid'));
  for (const checks of [
    [{ name: 'self-test', passed: 'false', detail: 'Strings are not evidence.' }],
    [{ name: '   ', passed: true, detail: 'Names must not be blank.' }],
    [{ name: 'self-test', passed: true, detail: '   ' }],
  ]) {
    assert.throws(() => manager.validate(invalidEpochId, checks), expectCode('INVALID_INPUT'));
    assert.equal(manager.require(invalidEpochId).state, 'PREPARED');
  }

  const sparseChecks = [];
  sparseChecks.length = 1;
  assert.throws(
    () => manager.validate(invalidEpochId, sparseChecks),
    expectCode('INVALID_INPUT'),
  );
  assert.equal(manager.require(invalidEpochId).state, 'PREPARED');

  const accessorEpochId = 'epoch_review_accessor';
  manager.prepare(epochSpec(accessorEpochId, 'accessor'));
  let reads = 0;
  const accessorCheck = Object.defineProperties({}, {
    name: { enumerable: true, get: () => 'self-test' },
    passed: {
      enumerable: true,
      get: () => {
        reads += 1;
        return reads === 1 ? true : 'false';
      },
    },
    detail: { enumerable: true, get: () => 'Capture validation evidence once.' },
  });
  const validated = manager.validate(accessorEpochId, [accessorCheck]);
  assert.equal(validated.state, 'VALIDATED');
  assert.equal(reads, 1);
  assert.equal(validated.validationChecks[0].passed, true);
  assert.equal(Object.isFrozen(validated.validationChecks[0]), true);
});

test('runtime snapshots receipt writer and signer custody at construction', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const epoch = activateEpoch(manager, 'epoch_review_receipt', 'receipt');
  const originalPair = generateKeyPairSync('ed25519');
  const replacementPair = generateKeyPairSync('ed25519');
  const originalLedger = [];
  const replacementLedger = [];
  let releaseKernel;
  let markStarted;
  const started = new Promise((resolve) => { markStarted = resolve; });
  const gate = new Promise((resolve) => { releaseKernel = resolve; });

  try {
    const config = {
      receiptSigner: { keyId: 'original-receipt-key', privateKey: originalPair.privateKey },
      receiptWriter: async (receipt) => originalLedger.push(receipt),
    };
    const runtime = new AlloyKernelRuntime({ stateBus: bus, epochManager: manager, config });
    runtime.register({
      kernelId: 'state.receipt-custody',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.review',
      requiresVerification: false,
      execute: async () => {
        markStarted();
        await gate;
        return [{
          stateType: 'prompt',
          portability: 'P4',
          payload: Buffer.from('custody-bound'),
        }];
      },
    });

    const execution = runtime.execute(requestFor('state.receipt-custody', epoch));
    await started;
    config.receiptSigner.keyId = 'replacement-receipt-key';
    config.receiptSigner.privateKey = replacementPair.privateKey;
    config.receiptWriter = async (receipt) => replacementLedger.push(receipt);
    releaseKernel();

    const result = await execution;
    assert.equal(originalLedger.length, 1);
    assert.equal(replacementLedger.length, 0);
    assert.equal(result.receipt.signature.keyId, 'original-receipt-key');
    assert.equal(verifyKernelExecutionReceipt(result.receipt, originalPair.publicKey), true);
    assert.equal(verifyKernelExecutionReceipt(result.receipt, replacementPair.publicKey), false);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});
