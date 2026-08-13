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

function prepareEpochDraft(manager, epochId, revision) {
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
  return {
    policyDigest,
    compatibility: {
      schemaDigest: digestObject({ schema: 'state.test/v1' }),
      policyDigest,
      cognitiveEpoch: epochId,
    },
  };
}

function prepareEpoch(manager, epochId, revision) {
  const prepared = prepareEpochDraft(manager, epochId, revision);
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
  return prepared;
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

function requestFor({
  actionId,
  kernelId,
  compatibility,
  epochId,
  inputCapsuleIds = [],
  idempotencyKey,
}) {
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
      decision: {
        effect: 'allow',
        reason: 'Bounded security conformance policy allows execution.',
      },
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
      idempotencyKey: 'idem-a',
    });

    await assert.rejects(runtime.execute(request), expectCode('COMPATIBILITY_MISMATCH'));
    await assert.rejects(runtime.execute(request), expectCode('COMPATIBILITY_MISMATCH'));
    assert.equal(executed, false);
    assert.equal(ledger.length, 2);
    assert.equal(
      ledger.every((receipt) => receipt.outcome === 'error'),
      true,
    );
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
      idempotencyKey: 'idem-b',
    });

    await assert.rejects(runtime.execute(request), expectCode('EPOCH_NOT_ACTIVE'));
    await assert.rejects(runtime.execute(request), expectCode('EPOCH_NOT_ACTIVE'));
    assert.equal(ledger.length, 0);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('a verifier cannot mutate the bytes that are persisted after verification', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_verifier_snapshot', 'rev-snapshot');
  const { privateKey } = generateKeyPairSync('ed25519');
  const expected = Buffer.from('verified-output');
  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async () => {},
      },
    });
    runtime.register({
      kernelId: 'state.verifier-snapshot',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: true,
      execute: async () => [
        {
          stateType: 'prompt',
          portability: 'P4',
          payload: Uint8Array.from(expected),
          governance: {
            sensitivity: 'public',
            retentionClass: 'session',
            reusePolicy: 'same_session',
            evidenceTier: 'MEASURED',
          },
        },
      ],
      verify: async (outputs) => {
        outputs[0].payload.fill(0);
        return {
          passed: true,
          reason: 'Verifier accepted its isolated copy.',
          evidenceDigests: [],
        };
      },
    });

    const request = requestFor({
      actionId: 'runtime-action-verifier-snapshot',
      kernelId: 'state.verifier-snapshot',
      compatibility: active.compatibility,
      epochId: 'epoch_verifier_snapshot',
    });
    const result = await runtime.execute(request);
    const stored = await bus.get(result.outputs[0].capsuleId, {
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      actionId: request.authorization.envelope.actionId,
      compatibility: result.outputs[0].compatibility,
      allowedSensitivities: ['public'],
    });
    assert.deepEqual(Buffer.from(stored.payload), expected);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('every kernel definition field is read once before validation and storage', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_definition_accessors', 'rev-definition-accessors');
  const { privateKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  const reads = {
    kernelId: 0,
    version: 0,
    kind: 0,
    route: 0,
    requiresVerification: 0,
    execute: 0,
    verify: 0,
  };
  const calls = { execute: 0, verify: 0 };
  const admittedExecute = async () => {
    calls.execute += 1;
    return [];
  };
  const admittedVerify = async () => {
    calls.verify += 1;
    return {
      passed: false,
      reason: 'The first-read verifier rejects this execution.',
      evidenceDigests: [],
    };
  };
  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    const definition = {};
    Object.defineProperties(definition, {
      kernelId: {
        enumerable: true,
        get() {
          reads.kernelId += 1;
          return reads.kernelId === 1 ? 'state.definition-accessors' : '';
        },
      },
      version: {
        enumerable: true,
        get() {
          reads.version += 1;
          return reads.version === 1 ? '1.0.0' : '';
        },
      },
      kind: {
        enumerable: true,
        get() {
          reads.kind += 1;
          return reads.kind === 1 ? 'custom' : 'forged';
        },
      },
      route: {
        enumerable: true,
        get() {
          reads.route += 1;
          return reads.route === 1 ? 'state.test' : '';
        },
      },
      requiresVerification: {
        enumerable: true,
        get() {
          reads.requiresVerification += 1;
          return reads.requiresVerification === 1;
        },
      },
      execute: {
        enumerable: true,
        get() {
          reads.execute += 1;
          return reads.execute === 1 ? admittedExecute : undefined;
        },
      },
      verify: {
        enumerable: true,
        get() {
          reads.verify += 1;
          return reads.verify === 1 ? admittedVerify : undefined;
        },
      },
    });

    runtime.register(definition);
    assert.deepEqual(reads, {
      kernelId: 1,
      version: 1,
      kind: 1,
      route: 1,
      requiresVerification: 1,
      execute: 1,
      verify: 1,
    });

    const request = requestFor({
      actionId: 'runtime-action-definition-accessors',
      kernelId: 'state.definition-accessors',
      compatibility: active.compatibility,
      epochId: 'epoch_definition_accessors',
    });
    await assert.rejects(runtime.execute(request), expectCode('VERIFICATION_FAILED'));
    assert.deepEqual(reads, {
      kernelId: 1,
      version: 1,
      kind: 1,
      route: 1,
      requiresVerification: 1,
      execute: 1,
      verify: 1,
    });
    assert.deepEqual(calls, { execute: 1, verify: 1 });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'blocked');
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('kernel registration snapshots verification policy and implementation', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_definition_snapshot', 'rev-definition');
  const { privateKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  const stats = { executeCalls: 0, verifyCalls: 0 };
  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    class DefinitionFixture {
      #stats;
      #reason;

      constructor(receiverStats) {
        this.#stats = receiverStats;
        this.#reason = 'The admitted verifier rejects this execution.';
        this.kernelId = 'state.definition-snapshot';
        this.version = '1.0.0';
        this.kind = 'custom';
        this.route = 'state.test';
        this.requiresVerification = true;
      }

      async execute() {
        this.#stats.executeCalls += 1;
        return [];
      }

      async verify() {
        this.#stats.verifyCalls += 1;
        return {
          passed: false,
          reason: this.#reason,
          evidenceDigests: [digestObject({ verifier: 'admitted' })],
        };
      }
    }
    const definition = new DefinitionFixture(stats);
    runtime.register(definition);
    definition.requiresVerification = false;
    definition.verify = undefined;

    const request = requestFor({
      actionId: 'runtime-action-definition-snapshot',
      kernelId: 'state.definition-snapshot',
      compatibility: active.compatibility,
      epochId: 'epoch_definition_snapshot',
    });
    await assert.rejects(runtime.execute(request), expectCode('VERIFICATION_FAILED'));
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'blocked');
    assert.equal(ledger[0].verifier.passed, false);
    assert.equal(stats.executeCalls, 1);
    assert.equal(stats.verifyCalls, 1);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('verifier decisions are read once and evidence digests are snapshotted', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_verifier_result', 'rev-verifier-result');
  const { privateKey } = generateKeyPairSync('ed25519');
  const ledger = [];
  const reads = { passed: 0, reason: 0, evidence: 0 };
  let evidenceReads = 0;
  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async (receipt) => ledger.push(receipt),
      },
    });
    const stableEvidenceDigest = digestObject({ verifier: 'stable' });
    const evidenceDigests = [];
    Object.defineProperty(evidenceDigests, 0, {
      enumerable: true,
      get() {
        evidenceReads += 1;
        return evidenceReads === 1 ? stableEvidenceDigest : 'not-a-sha256-digest';
      },
    });
    evidenceDigests.length = 1;
    const verifierResult = {};
    Object.defineProperties(verifierResult, {
      passed: {
        enumerable: true,
        get() {
          reads.passed += 1;
          return reads.passed === 1 ? false : true;
        },
      },
      reason: {
        enumerable: true,
        get() {
          reads.reason += 1;
          return reads.reason === 1
            ? 'Verifier rejected the snapshotted result.'
            : 'Accessor changed the rejection reason.';
        },
      },
      evidenceDigests: {
        enumerable: true,
        get() {
          reads.evidence += 1;
          return reads.evidence === 1 ? evidenceDigests : ['not-a-sha256-digest'];
        },
      },
    });
    runtime.register({
      kernelId: 'state.verifier-result',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: true,
      execute: async () => [],
      verify: async () => verifierResult,
    });

    const request = requestFor({
      actionId: 'runtime-action-verifier-result',
      kernelId: 'state.verifier-result',
      compatibility: active.compatibility,
      epochId: 'epoch_verifier_result',
    });
    await assert.rejects(runtime.execute(request), expectCode('VERIFICATION_FAILED'));
    assert.deepEqual(reads, { passed: 1, reason: 1, evidence: 1 });
    assert.equal(evidenceReads, 1);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'blocked');
    assert.equal(ledger[0].verifier.passed, false);
    assert.equal(ledger[0].verifier.reason, 'Verifier rejected the snapshotted result.');
    assert.equal(ledger[0].verifier.evidenceDigests[0], stableEvidenceDigest);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('malformed verifier evidence digests fail closed', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_verifier_digest', 'rev-verifier-digest');
  const { privateKey } = generateKeyPairSync('ed25519');
  try {
    const runtime = new AlloyKernelRuntime({
      stateBus: bus,
      epochManager: manager,
      config: {
        receiptSigner: { keyId: 'test-key', privateKey },
        receiptWriter: async () => {},
      },
    });
    runtime.register({
      kernelId: 'state.verifier-digest',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: true,
      execute: async () => [],
      verify: async () => ({
        passed: true,
        reason: 'Malformed evidence must not reach a receipt.',
        evidenceDigests: ['not-a-sha256-digest'],
      }),
    });

    const request = requestFor({
      actionId: 'runtime-action-verifier-digest',
      kernelId: 'state.verifier-digest',
      compatibility: active.compatibility,
      epochId: 'epoch_verifier_digest',
    });
    await assert.rejects(runtime.execute(request), expectCode('INVALID_INPUT'));
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('cognitive epoch validation checks enforce boolean passed', () => {
  const manager = new CognitiveEpochManager();
  prepareEpochDraft(manager, 'epoch_validation_passed', 'rev-validation-passed');
  assert.throws(
    () =>
      manager.validate('epoch_validation_passed', [
        { name: 'self-test', passed: 1, detail: 'Validation must use boolean pass/fail values.' },
      ]),
    expectCode('INVALID_INPUT'),
  );
});

test('cognitive epoch validation checks require non-empty name and detail strings', () => {
  const manager = new CognitiveEpochManager();
  prepareEpochDraft(manager, 'epoch_validation_shape_name', 'rev-validation-shape-name');
  assert.throws(
    () =>
      manager.validate('epoch_validation_shape_name', [
        { name: '', passed: true, detail: 'Passed.' },
      ]),
    expectCode('INVALID_INPUT'),
  );
  prepareEpochDraft(manager, 'epoch_validation_shape_detail', 'rev-validation-shape-detail');
  assert.throws(
    () =>
      manager.validate('epoch_validation_shape_detail', [
        { name: 'self-test', passed: true, detail: '' },
      ]),
    expectCode('INVALID_INPUT'),
  );
});

test('cognitive epoch validation check fields are read and stored exactly once', () => {
  const manager = new CognitiveEpochManager();
  prepareEpochDraft(manager, 'epoch_validation_accessor', 'rev-validation-accessor');
  const reads = { name: 0, passed: 0, detail: 0 };
  const check = {};
  Object.defineProperties(check, {
    name: {
      enumerable: true,
      get() {
        reads.name += 1;
        return reads.name === 1 ? 'self-test' : '';
      },
    },
    passed: {
      enumerable: true,
      get() {
        reads.passed += 1;
        return reads.passed === 1 ? false : true;
      },
    },
    detail: {
      enumerable: true,
      get() {
        reads.detail += 1;
        return reads.detail === 1 ? 'Rejected by the immutable check.' : '';
      },
    },
  });

  const record = manager.validate('epoch_validation_accessor', [check]);
  assert.deepEqual(reads, { name: 1, passed: 1, detail: 1 });
  assert.equal(record.state, 'REJECTED');
  assert.deepEqual(record.validationChecks, [
    {
      name: 'self-test',
      passed: false,
      detail: 'Rejected by the immutable check.',
    },
  ]);
});

test('malformed cognitive epoch digests are rejected before storage', () => {
  const manager = new CognitiveEpochManager();
  assert.throws(
    () =>
      manager.prepare({
        epochId: 'epoch_invalid_digest',
        tenantId: 'tenant_a',
        route: 'state.test',
        modelId: 'model-invalid',
        modelRevision: 'rev-invalid',
        engineId: 'engine-a',
        engineVersion: '1.0.0',
        tokenizerDigest: 'not-a-sha256-digest',
        layoutDigest: digestObject({ layout: 'invalid' }),
        adapterSetDigest: digestObject({ adapters: [] }),
        verifierSetDigest: digestObject({ verifiers: [] }),
        promptBundleDigest: digestObject({ prompt: 'invalid' }),
        policyDigest: digestObject({ policy: 'invalid' }),
        toolManifestDigest: digestObject({ tools: [] }),
        createdAt: new Date().toISOString(),
      }),
    expectCode('INVALID_INPUT'),
  );
  assert.equal(manager.get('epoch_invalid_digest'), undefined);
});

test('every cognitive epoch field is read once before validation, hashing, lookup, and storage', () => {
  const digestFields = new Set([
    'tokenizerDigest',
    'layoutDigest',
    'adapterSetDigest',
    'verifierSetDigest',
    'promptBundleDigest',
    'policyDigest',
    'toolManifestDigest',
  ]);
  const baseSpec = {
    epochId: 'epoch_accessor_all_fields',
    tenantId: 'tenant_a',
    route: 'state.test',
    modelId: 'model-accessor',
    modelRevision: 'rev-accessor',
    engineId: 'engine-a',
    engineVersion: '1.0.0',
    tokenizerDigest: digestObject({ tokenizer: 'accessor' }),
    layoutDigest: digestObject({ layout: 'accessor' }),
    adapterSetDigest: digestObject({ adapters: [] }),
    verifierSetDigest: digestObject({ verifiers: [] }),
    promptBundleDigest: digestObject({ prompt: 'accessor' }),
    policyDigest: digestObject({ policy: 'accessor' }),
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  };

  for (const field of Object.keys(baseSpec)) {
    const manager = new CognitiveEpochManager();
    const stableSpec = { ...baseSpec, epochId: `${baseSpec.epochId}_${field}` };
    const stableValue = stableSpec[field];
    const changedValue = digestFields.has(field)
      ? digestObject({ field, changed: true })
      : field === 'createdAt'
        ? new Date(Date.now() + 60_000).toISOString()
        : `${stableValue}-changed`;
    let reads = 0;
    const accessorSpec = { ...stableSpec };
    Object.defineProperty(accessorSpec, field, {
      enumerable: true,
      get() {
        reads += 1;
        return reads === 1 ? stableValue : changedValue;
      },
    });

    const prepared = manager.prepare(accessorSpec);
    assert.equal(reads, 1, field);
    assert.equal(prepared[field], stableValue, field);
    assert.equal(manager.require(stableSpec.epochId)[field], stableValue, field);
  }
});

test('kernel outputs cannot downgrade the highest input sensitivity', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_sensitivity_floor', 'rev-sensitivity');
  const input = await bus.put({
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    stateType: 'prompt',
    portability: 'P4',
    payload: Buffer.from('confidential'),
    compatibility: active.compatibility,
    governance: {
      sensitivity: 'confidential',
      retentionClass: 'session',
      reusePolicy: 'same_session',
      evidenceTier: 'MEASURED',
    },
    provenance: { sourceActionId: 'seed_action', parentCapsuleIds: [] },
  });
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
      kernelId: 'state.sensitivity-floor',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async ({ capsules }) => [
        {
          stateType: 'prompt',
          portability: 'P4',
          payload: Uint8Array.from(capsules[0].payload),
          governance: {
            sensitivity: 'public',
            retentionClass: 'session',
            reusePolicy: 'same_session',
            evidenceTier: 'MEASURED',
          },
        },
      ],
    });

    const request = requestFor({
      actionId: 'runtime-action-sensitivity-floor',
      kernelId: 'state.sensitivity-floor',
      compatibility: active.compatibility,
      epochId: 'epoch_sensitivity_floor',
      inputCapsuleIds: [input.capsuleId],
    });
    await assert.rejects(runtime.execute(request), expectCode('REUSE_DENIED'));
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'error');
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
