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
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

function prepareEpoch(manager, epochId = 'epoch_boundary', revision = 'rev-boundary') {
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
    verifierSetDigest: digestObject({ verifiers: ['boundary'] }),
    promptBundleDigest: digestObject({ prompt: revision }),
    policyDigest,
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  });
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
  return {
    epochId,
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

function requestFor({
  actionId,
  kernelId,
  compatibility,
  epochId,
  inputCapsuleIds = [],
  effect = 'allow',
  budget,
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
      decision: { effect, reason: 'Boundary regression policy decision.' },
      allowedSensitivities: ['public', 'internal', 'confidential'],
    },
    kernelId,
    tenantId: 'tenant_a',
    sessionId: 'session_a',
    inputCapsuleIds,
    inputCompatibility: compatibility,
    parameters: { nested: { value: 1 } },
    budget: budget ?? {
      maxRuntimeMs: 2_000,
      maxInputBytes: 4096,
      maxOutputBytes: 4096,
      maxStateWrites: 1,
    },
    epochId,
    idempotencyKey,
  });
}

function createRuntime(bus, manager, ledger) {
  const { privateKey } = generateKeyPairSync('ed25519');
  return new AlloyKernelRuntime({
    stateBus: bus,
    epochManager: manager,
    config: {
      receiptSigner: { keyId: 'test-key', privateKey },
      receiptWriter: async (receipt) => ledger.push(receipt),
    },
  });
}

function outputState(value = 'output') {
  return {
    stateType: 'prompt',
    portability: 'P4',
    payload: Buffer.from(value),
  };
}

test('registered kernel invariants cannot be downgraded through caller mutation', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_definition_snapshot', 'rev-definition');
  const ledger = [];
  let executionCalls = 0;
  let verifierCalls = 0;
  try {
    const runtime = createRuntime(bus, manager, ledger);
    const definition = {
      kernelId: 'state.definition-snapshot',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: true,
      execute: async () => {
        executionCalls += 1;
        return [outputState('must-be-verified')];
      },
      verify: async () => {
        verifierCalls += 1;
        return {
          passed: false,
          reason: 'Independent verifier rejected output.',
          evidenceDigests: [],
        };
      },
    };
    runtime.register(definition);

    definition.requiresVerification = false;
    definition.verify = undefined;
    definition.execute = async () => [];

    const request = requestFor({
      actionId: 'runtime-action-definition-snapshot',
      kernelId: 'state.definition-snapshot',
      compatibility: active.compatibility,
      epochId: active.epochId,
    });
    await assert.rejects(runtime.execute(request), expectCode('VERIFICATION_FAILED'));
    assert.equal(executionCalls, 1);
    assert.equal(verifierCalls, 1);
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'blocked');
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('unknown policy effects fail closed before epoch pinning or execution', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_unknown_policy', 'rev-policy');
  const ledger = [];
  let executed = false;
  try {
    const runtime = createRuntime(bus, manager, ledger);
    runtime.register({
      kernelId: 'state.unknown-policy',
      version: '1.0.0',
      kind: 'policy',
      route: 'state.test',
      requiresVerification: false,
      execute: async () => {
        executed = true;
        return [];
      },
    });
    const request = requestFor({
      actionId: 'runtime-action-unknown-policy',
      kernelId: 'state.unknown-policy',
      compatibility: active.compatibility,
      epochId: active.epochId,
      effect: 'deny',
    });
    await assert.rejects(runtime.execute(request), expectCode('INVALID_INPUT'));
    assert.equal(executed, false);
    assert.equal(ledger.length, 0);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('kernel code cannot mutate its context budget to exceed authorized limits', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_budget_snapshot', 'rev-budget');
  const ledger = [];
  try {
    const runtime = createRuntime(bus, manager, ledger);
    runtime.register({
      kernelId: 'state.budget-snapshot',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async (_input, context) => {
        try {
          context.budget.maxStateWrites = 2;
        } catch {}
        try {
          context.budget.maxOutputBytes = 8192;
        } catch {}
        return [outputState('one'), outputState('two')];
      },
    });
    const request = requestFor({
      actionId: 'runtime-action-budget-snapshot',
      kernelId: 'state.budget-snapshot',
      compatibility: active.compatibility,
      epochId: active.epochId,
    });
    await assert.rejects(runtime.execute(request), expectCode('BUDGET_EXCEEDED'));
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].budget.maxStateWrites, 1);
    assert.equal(ledger[0].outcome, 'error');
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('kernel input mutation cannot alter the verifier input snapshot', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_input_snapshot', 'rev-input');
  const ledger = [];
  const trusted = Buffer.from('trusted-input');
  let executionCapsule;
  let verifierCapsule;
  try {
    const input = await bus.put({
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      stateType: 'prompt',
      portability: 'P4',
      payload: trusted,
      compatibility: active.compatibility,
      governance: {
        sensitivity: 'confidential',
        retentionClass: 'session',
        reusePolicy: 'same_session',
        evidenceTier: 'MEASURED',
      },
      provenance: { sourceActionId: 'seed_action', parentCapsuleIds: [] },
    });
    const runtime = createRuntime(bus, manager, ledger);
    runtime.register({
      kernelId: 'state.input-snapshot',
      version: '1.0.0',
      kind: 'verification',
      route: 'state.test',
      requiresVerification: true,
      execute: async ({ capsules }) => {
        executionCapsule = capsules[0].capsule;
        capsules[0].payload.fill(0);
        try {
          capsules[0].capsule.governance.sensitivity = 'public';
        } catch {}
        try {
          capsules[0].capsule.provenance.parentCapsuleIds.push('forged-parent');
        } catch {}
        return [outputState('accepted')];
      },
      verify: async (_outputs, { capsules }) => {
        verifierCapsule = capsules[0].capsule;
        return {
          passed:
            Buffer.from(capsules[0].payload).equals(trusted) &&
            capsules[0].capsule.governance.sensitivity === 'confidential' &&
            !capsules[0].capsule.provenance.parentCapsuleIds.includes('forged-parent'),
          reason: 'Verifier received isolated capsule metadata and payload bytes.',
          evidenceDigests: [],
        };
      },
    });
    const request = requestFor({
      actionId: 'runtime-action-input-snapshot',
      kernelId: 'state.input-snapshot',
      compatibility: active.compatibility,
      epochId: active.epochId,
      inputCapsuleIds: [input.capsuleId],
    });
    const result = await runtime.execute(request);
    assert.equal(result.receipt.outcome, 'success');
    assert.equal(result.receipt.verifier.passed, true);
    assert.notEqual(executionCapsule, verifierCapsule);
    assert.notEqual(executionCapsule, input);
    assert.notEqual(verifierCapsule, input);
    assert.notEqual(executionCapsule.governance, verifierCapsule.governance);
    assert.notEqual(executionCapsule.provenance, verifierCapsule.provenance);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('caller mutation after execute starts cannot alter admission, execution, or receipt fields', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_request_snapshot', 'rev-request');
  const ledger = [];
  let observed;
  try {
    const runtime = createRuntime(bus, manager, ledger);
    runtime.register({
      kernelId: 'state.request-snapshot',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.test',
      requiresVerification: false,
      execute: async (input, context) => {
        await new Promise((resolve) => setImmediate(resolve));
        observed = {
          actionId: context.actionId,
          tenantId: context.tenantId,
          sessionId: context.sessionId,
          parameterValue: input.parameters.nested.value,
          inputCount: input.capsules.length,
        };
        return [outputState('one'), outputState('two')];
      },
    });
    const request = requestFor({
      actionId: 'runtime-action-request-snapshot',
      kernelId: 'state.request-snapshot',
      compatibility: active.compatibility,
      epochId: active.epochId,
    });
    const execution = runtime.execute(request);
    request.authorization.decision.effect = 'block';
    request.authorization.decision.reason = 'Caller changed the policy decision.';
    request.authorization.envelope.actionId = 'mutated-action';
    request.authorization.envelope.tenantId = 'mutated-tenant';
    request.authorization.envelope.argsDigest = '0'.repeat(64);
    request.authorization.allowedSensitivities.length = 0;
    request.tenantId = 'mutated-tenant';
    request.sessionId = 'mutated-session';
    request.epochId = 'mutated-epoch';
    request.parameters.nested.value = 99;
    request.inputCapsuleIds.push('forged-capsule');
    request.budget.maxStateWrites = 2;
    request.budget.maxOutputBytes = 8192;
    await assert.rejects(execution, expectCode('BUDGET_EXCEEDED'));
    assert.deepEqual(observed, {
      actionId: 'runtime-action-request-snapshot',
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      parameterValue: 1,
      inputCount: 0,
    });
    assert.equal(ledger.length, 1);
    assert.equal(ledger[0].outcome, 'error');
    assert.equal(ledger[0].actionId, 'runtime-action-request-snapshot');
    assert.equal(ledger[0].tenantId, 'tenant_a');
    assert.equal(ledger[0].sessionId, 'session_a');
    assert.equal(ledger[0].epochId, active.epochId);
    assert.equal(ledger[0].policyEffect, 'allow');
    assert.equal(ledger[0].policyReason, 'Boundary regression policy decision.');
    assert.deepEqual(ledger[0].inputCapsuleIds, []);
    assert.equal(ledger[0].budget.maxStateWrites, 1);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});

test('verifier closure mutation cannot change the output snapshot selected for persistence', async () => {
  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const manager = new CognitiveEpochManager();
  const active = prepareEpoch(manager, 'epoch_output_snapshot', 'rev-output');
  const ledger = [];
  const expected = Buffer.from('stable-output');
  let rawOutput;
  try {
    const runtime = createRuntime(bus, manager, ledger);
    runtime.register({
      kernelId: 'state.output-snapshot',
      version: '1.0.0',
      kind: 'verification',
      route: 'state.test',
      requiresVerification: true,
      execute: async () => {
        rawOutput = [outputState(expected)];
        return rawOutput;
      },
      verify: async () => {
        rawOutput[0].payload.fill(0);
        return {
          passed: true,
          reason: 'Verifier accepted the immutable output snapshot.',
          evidenceDigests: [],
        };
      },
    });
    const request = requestFor({
      actionId: 'runtime-action-output-snapshot',
      kernelId: 'state.output-snapshot',
      compatibility: active.compatibility,
      epochId: active.epochId,
    });
    const result = await runtime.execute(request);
    const stored = await bus.get(result.outputs[0].capsuleId, {
      tenantId: 'tenant_a',
      sessionId: 'session_a',
      actionId: request.authorization.envelope.actionId,
      compatibility: result.outputs[0].compatibility,
      allowedSensitivities: ['internal'],
    });
    assert.deepEqual(Buffer.from(stored.payload), expected);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }
});
