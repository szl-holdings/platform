import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { performance } from 'node:perf_hooks';
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

function makeEpoch(epochId) {
  const policyDigest = digestObject({ policy: 'verifier-timeout-policy', version: 1 });
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
    verifierSetDigest: digestObject({ verifiers: ['timeout'] }),
    promptBundleDigest: digestObject({ prompt: 'a' }),
    policyDigest,
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  });
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
  return { manager, policyDigest };
}

function compatibility(policyDigest, epochId) {
  return {
    schemaDigest: digestObject({ schema: 'state.test/v1' }),
    policyDigest,
    cognitiveEpoch: epochId,
  };
}

test('maxRuntimeMs is a shared hard deadline across execution and mandatory verification', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const epochId = 'epoch_verifier_timeout';
  const { manager, policyDigest } = makeEpoch(epochId);
  const inputCompatibility = compatibility(policyDigest, epochId);
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  let verifierSignalAborted = false;
  let outputWriteAttempts = 0;

  try {
    const input = await bus.put({
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      stateType: 'prompt',
      portability: 'P4',
      payload: Buffer.from('{"value":7}'),
      compatibility: inputCompatibility,
      governance: {
        sensitivity: 'confidential',
        retentionClass: 'session',
        reusePolicy: 'same_session',
        evidenceTier: 'MEASURED',
      },
      provenance: { sourceActionId: 'seed_action', parentCapsuleIds: [] },
    });

    const originalPut = bus.put.bind(bus);
    bus.put = async (putRequest) => {
      if (putRequest.provenance.producerKernelId === 'state.verifier-timeout') {
        outputWriteAttempts += 1;
      }
      return originalPut(putRequest);
    };

    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    runtime.register({
      kernelId: 'state.verifier-timeout',
      version: '1.0.0',
      kind: 'verification',
      route: 'state.test',
      requiresVerification: true,
      execute: async () => [
        {
          stateType: 'structured_memory',
          portability: 'P4',
          payload: Buffer.from('{"value":8}'),
        },
      ],
      verify: async (_output, _input, context) =>
        new Promise(() => {
          context.signal.addEventListener(
            'abort',
            () => {
              verifierSignalAborted = true;
            },
            { once: true },
          );
        }),
    });

    const provisional = {
      authorization: {
        envelope: {
          schema: 'szl.governed-action/v1',
          actionId: 'runtime-action-verifier-timeout',
          toolName: 'state.verifier-timeout',
          actorId: 'operator-a',
          tenantId: 'tenant_a',
          risk: 'medium',
          mutatesState: true,
          requestedAt: new Date().toISOString(),
          argsDigest: '',
        },
        decision: { effect: 'allow', reason: 'Bounded test policy allows execution.' },
        allowedSensitivities: ['confidential'],
      },
      kernelId: 'state.verifier-timeout',
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      inputCapsuleIds: [input.capsuleId],
      inputCompatibility,
      parameters: {},
      budget: {
        maxRuntimeMs: 40,
        maxInputBytes: 4096,
        maxOutputBytes: 4096,
        maxStateWrites: 1,
      },
      epochId,
      idempotencyKey: 'verifier-timeout-1',
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

    const startedAt = performance.now();
    await assert.rejects(runtime.execute(request), expectCode('BUDGET_EXCEEDED'));
    const elapsedMs = performance.now() - startedAt;

    assert.equal(verifierSignalAborted, true);
    assert.equal(outputWriteAttempts, 0);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'error');
    assert.match(ledger[0].reason, /Kernel verification exceeded the shared kernel runtime budget/);
    assert.equal(verifyKernelExecutionReceipt(ledger[0], publicKey), true);
    assert.ok(elapsedMs >= 20, `deadline fired too early: ${elapsedMs}ms`);
    assert.ok(elapsedMs < 1_000, `deadline did not terminate verification: ${elapsedMs}ms`);

    await assert.rejects(runtime.execute(request), expectCode('INDETERMINATE'));
    assert.equal(ledger.length, 1);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});
