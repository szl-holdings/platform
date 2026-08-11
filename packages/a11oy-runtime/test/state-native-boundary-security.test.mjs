import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import test from 'node:test';
import {
  AlloyKernelRuntime,
  AlloyStateBus,
  CognitiveEpochManager,
  ReasoningVault,
  StateNativeError,
  constantTimeEqualHex,
  digestObject,
  kernelRequestDigest,
} from '../dist/state-native/index.js';

function expectCode(code) {
  return (error) => error instanceof StateNativeError && error.code === code;
}

function prepareEpoch(manager, { tenantId, route, epochId }) {
  const policyDigest = digestObject({ policy: epochId, version: 1 });
  manager.prepare({
    epochId,
    tenantId,
    route,
    modelId: `model-${epochId}`,
    modelRevision: 'rev-1',
    engineId: 'engine-a',
    engineVersion: '1.0.0',
    tokenizerDigest: digestObject({ tokenizer: epochId }),
    layoutDigest: digestObject({ layout: epochId }),
    adapterSetDigest: digestObject({ adapters: [] }),
    verifierSetDigest: digestObject({ verifiers: ['shape'] }),
    promptBundleDigest: digestObject({ prompt: epochId }),
    policyDigest,
    toolManifestDigest: digestObject({ tools: [] }),
    createdAt: new Date().toISOString(),
  });
  manager.validate(epochId, [{ name: 'self-test', passed: true, detail: 'Passed.' }]);
  manager.activate(epochId);
  return {
    policyDigest,
    p4: {
      schemaDigest: digestObject({ schema: 'state.boundary/v1' }),
      policyDigest,
      cognitiveEpoch: epochId,
    },
    p5: {
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

function kernelRequest({
  tenantId,
  sessionId = 'session-a',
  kernelId,
  epochId,
  compatibility,
  inputCapsuleIds = [],
  allowedSensitivities = ['internal'],
  idempotencyKey,
}) {
  return bindRequest({
    authorization: {
      envelope: {
        schema: 'szl.governed-action/v1',
        actionId: `action-${tenantId}-${kernelId}`,
        toolName: kernelId,
        actorId: 'operator-a',
        tenantId,
        risk: 'medium',
        mutatesState: true,
        requestedAt: new Date().toISOString(),
        argsDigest: '',
      },
      decision: { effect: 'allow', reason: 'Boundary conformance policy allows execution.' },
      allowedSensitivities,
    },
    kernelId,
    tenantId,
    sessionId,
    inputCapsuleIds,
    inputCompatibility: compatibility,
    parameters: {},
    budget: {
      maxRuntimeMs: 2_000,
      maxInputBytes: 4_096,
      maxOutputBytes: 4_096,
      maxStateWrites: 1,
    },
    epochId,
    idempotencyKey,
  });
}

test('State Bus rejects incomplete portability fingerprints before persistence', async () => {
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
          policyDigest: digestObject({ policy: 'p' }),
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

test('State Bus ignores a forged caller clock when enforcing expiry', async () => {
  let nowMs = Date.parse('2026-08-11T12:00:00.000Z');
  const key = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: key, clock: () => new Date(nowMs) });
  const compatibility = {
    schemaDigest: digestObject({ schema: 'state.expiry/v1' }),
    policyDigest: digestObject({ policy: 'expiry' }),
    cognitiveEpoch: 'epoch-expiry',
  };
  try {
    const capsule = await bus.put({
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      stateType: 'structured_memory',
      portability: 'P4',
      payload: Buffer.from('{"value":1}'),
      compatibility,
      governance: {
        sensitivity: 'internal',
        retentionClass: 'session',
        reusePolicy: 'same_session',
        evidenceTier: 'MEASURED',
      },
      provenance: { sourceActionId: 'seed', parentCapsuleIds: [] },
      expiresAt: new Date(nowMs + 1_000).toISOString(),
    });
    nowMs += 2_000;
    await assert.rejects(
      bus.get(capsule.capsuleId, {
        tenantId: 'tenant-a',
        sessionId: 'session-a',
        actionId: 'read',
        compatibility,
        allowedSensitivities: ['internal'],
        now: new Date('2026-08-11T12:00:00.000Z'),
      }),
      expectCode('EXPIRED'),
    );
  } finally {
    bus.dispose();
    key.fill(0);
  }
});

test('Reasoning Vault ignores forged checkout time and validates numeric limits', () => {
  const invalidKey = randomBytes(32);
  try {
    assert.throws(
      () => new ReasoningVault({ masterKey: invalidKey, maxEntryBytes: 0 }),
      expectCode('INVALID_INPUT'),
    );
  } finally {
    invalidKey.fill(0);
  }

  let nowMs = Date.parse('2026-08-11T12:00:00.000Z');
  const key = randomBytes(32);
  const vault = new ReasoningVault({ masterKey: key, clock: () => new Date(nowMs) });
  try {
    assert.throws(
      () =>
        vault.store({
          tenantId: 'tenant-a',
          sessionId: 'session-a',
          modelId: 'model-a',
          modelRevision: 'rev-1',
          cognitiveEpoch: 'epoch-a',
          providerRequestId: 'provider-a',
          payload: Buffer.from('opaque-state'),
          ttlMs: 1.5,
        }),
      expectCode('INVALID_INPUT'),
    );
    const entry = vault.store({
      tenantId: 'tenant-a',
      sessionId: 'session-a',
      modelId: 'model-a',
      modelRevision: 'rev-1',
      cognitiveEpoch: 'epoch-a',
      providerRequestId: 'provider-a',
      payload: Buffer.from('opaque-state'),
      ttlMs: 1_000,
    });
    nowMs += 2_000;
    assert.throws(
      () =>
        vault.checkout({
          entryId: entry.entryId,
          tenantId: 'tenant-a',
          sessionId: 'session-a',
          modelId: 'model-a',
          modelRevision: 'rev-1',
          cognitiveEpoch: 'epoch-a',
          now: new Date('2026-08-11T12:00:00.000Z'),
        }),
      expectCode('EXPIRED'),
    );
  } finally {
    vault.dispose();
    key.fill(0);
  }
});

test('canonical scope keys isolate delimiter-equivalent tenant and route pairs', async () => {
  const manager = new CognitiveEpochManager();
  prepareEpoch(manager, { tenantId: 'tenant:a', route: 'b', epochId: 'epoch-one' });
  prepareEpoch(manager, { tenantId: 'tenant', route: 'a:b', epochId: 'epoch-two' });
  assert.equal(manager.active('tenant:a', 'b')?.epochId, 'epoch-one');
  assert.equal(manager.active('tenant', 'a:b')?.epochId, 'epoch-two');

  const stateKey = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: stateKey });
  const compatibility = {
    schemaDigest: digestObject({ schema: 'state.scope/v1' }),
    policyDigest: digestObject({ policy: 'scope' }),
    cognitiveEpoch: 'epoch-scope',
  };
  try {
    const first = await bus.put({
      tenantId: 'tenant:a',
      sessionId: 'session-a',
      stateType: 'structured_memory',
      portability: 'P4',
      payload: Buffer.from('first'),
      compatibility,
      governance: {
        sensitivity: 'internal',
        retentionClass: 'session',
        reusePolicy: 'same_session',
        evidenceTier: 'MEASURED',
      },
      provenance: { sourceActionId: 'seed-a', parentCapsuleIds: [] },
      idempotencyKey: 'b',
    });
    const second = await bus.put({
      tenantId: 'tenant',
      sessionId: 'session-b',
      stateType: 'structured_memory',
      portability: 'P4',
      payload: Buffer.from('second'),
      compatibility,
      governance: {
        sensitivity: 'internal',
        retentionClass: 'session',
        reusePolicy: 'same_session',
        evidenceTier: 'MEASURED',
      },
      provenance: { sourceActionId: 'seed-b', parentCapsuleIds: [] },
      idempotencyKey: 'a:b',
    });
    assert.notEqual(first.capsuleId, second.capsuleId);
    assert.equal(bus.listMetadata('tenant:a').length, 1);
    assert.equal(bus.listMetadata('tenant').length, 1);
  } finally {
    bus.dispose();
    stateKey.fill(0);
  }

  const vaultKey = randomBytes(32);
  const vault = new ReasoningVault({ masterKey: vaultKey });
  try {
    const first = vault.store({
      tenantId: 'tenant:a',
      sessionId: 'session-a',
      modelId: 'model-a',
      modelRevision: 'rev-1',
      cognitiveEpoch: 'epoch-a',
      providerRequestId: 'provider-a',
      payload: Buffer.from('first'),
      ttlMs: 1_000,
      idempotencyKey: 'b',
    });
    const second = vault.store({
      tenantId: 'tenant',
      sessionId: 'session-b',
      modelId: 'model-b',
      modelRevision: 'rev-1',
      cognitiveEpoch: 'epoch-b',
      providerRequestId: 'provider-b',
      payload: Buffer.from('second'),
      ttlMs: 1_000,
      idempotencyKey: 'a:b',
    });
    assert.notEqual(first.entryId, second.entryId);
  } finally {
    vault.dispose();
    vaultKey.fill(0);
  }
});

test('kernel replay scopes isolate delimiter-equivalent tenant/key pairs', async () => {
  const key = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: key });
  const manager = new CognitiveEpochManager();
  const firstEpoch = prepareEpoch(manager, {
    tenantId: 'tenant:a',
    route: 'state.scope',
    epochId: 'epoch-kernel-one',
  });
  const secondEpoch = prepareEpoch(manager, {
    tenantId: 'tenant',
    route: 'state.scope',
    epochId: 'epoch-kernel-two',
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
      kernelId: 'state.scope',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.scope',
      requiresVerification: false,
      execute: async () => [],
    });

    await runtime.execute(
      kernelRequest({
        tenantId: 'tenant:a',
        kernelId: 'state.scope',
        epochId: 'epoch-kernel-one',
        compatibility: firstEpoch.p5,
        idempotencyKey: 'b',
      }),
    );
    await runtime.execute(
      kernelRequest({
        tenantId: 'tenant',
        kernelId: 'state.scope',
        epochId: 'epoch-kernel-two',
        compatibility: secondEpoch.p5,
        idempotencyKey: 'a:b',
      }),
    );
    assert.equal(ledger.length, 2);
    assert.equal(ledger.every((receipt) => receipt.outcome === 'success'), true);
  } finally {
    bus.dispose();
    key.fill(0);
  }
});

test('kernel and verifier mutations cannot change the persisted output snapshot', async () => {
  const key = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: key });
  const manager = new CognitiveEpochManager();
  const epoch = prepareEpoch(manager, {
    tenantId: 'tenant-verify',
    route: 'state.verify',
    epochId: 'epoch-verify',
  });
  const { privateKey } = generateKeyPairSync('ed25519');
  const rawPayload = Uint8Array.from([1, 2, 3]);
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
      kernelId: 'state.verify',
      version: '1.0.0',
      kind: 'verification',
      route: 'state.verify',
      requiresVerification: true,
      execute: async () => [
        {
          stateType: 'structured_memory',
          portability: 'P5',
          payload: rawPayload,
        },
      ],
      verify: async (output) => {
        rawPayload[0] = 8;
        output[0].payload[1] = 9;
        return {
          passed: true,
          reason: 'The isolated snapshot is valid.',
          evidenceDigests: [digestObject({ verifier: 'passed' })],
        };
      },
    });

    const result = await runtime.execute(
      kernelRequest({
        tenantId: 'tenant-verify',
        kernelId: 'state.verify',
        epochId: 'epoch-verify',
        compatibility: epoch.p5,
      }),
    );
    const stored = await bus.get(result.outputs[0].capsuleId, {
      tenantId: 'tenant-verify',
      sessionId: 'session-a',
      actionId: 'read-verified-output',
      compatibility: epoch.p5,
      allowedSensitivities: ['internal'],
    });
    assert.deepEqual([...stored.payload], [1, 2, 3]);
  } finally {
    bus.dispose();
    key.fill(0);
  }
});

test('kernel outputs cannot downgrade confidential input sensitivity', async () => {
  const key = randomBytes(32);
  const bus = new AlloyStateBus({ masterKey: key });
  const manager = new CognitiveEpochManager();
  const epoch = prepareEpoch(manager, {
    tenantId: 'tenant-sensitive',
    route: 'state.sensitive',
    epochId: 'epoch-sensitive',
  });
  const input = await bus.put({
    tenantId: 'tenant-sensitive',
    sessionId: 'session-a',
    stateType: 'structured_memory',
    portability: 'P4',
    payload: Buffer.from('{"secret":true}'),
    compatibility: epoch.p4,
    governance: {
      sensitivity: 'confidential',
      retentionClass: 'session',
      reusePolicy: 'same_session',
      evidenceTier: 'MEASURED',
    },
    provenance: { sourceActionId: 'seed-sensitive', parentCapsuleIds: [] },
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
      kernelId: 'state.sensitive',
      version: '1.0.0',
      kind: 'custom',
      route: 'state.sensitive',
      requiresVerification: false,
      execute: async () => [
        {
          stateType: 'structured_memory',
          portability: 'P4',
          payload: Buffer.from('{"copied":true}'),
          governance: {
            sensitivity: 'public',
            retentionClass: 'session',
            reusePolicy: 'same_session',
            evidenceTier: 'MEASURED',
          },
        },
      ],
    });

    await assert.rejects(
      runtime.execute(
        kernelRequest({
          tenantId: 'tenant-sensitive',
          kernelId: 'state.sensitive',
          epochId: 'epoch-sensitive',
          compatibility: epoch.p4,
          inputCapsuleIds: [input.capsuleId],
          allowedSensitivities: ['confidential'],
        }),
      ),
      expectCode('REUSE_DENIED'),
    );
    assert.equal(bus.listMetadata('tenant-sensitive').length, 1);
    assert.equal(ledger.at(-1)?.outcome, 'error');
  } finally {
    bus.dispose();
    key.fill(0);
  }
});

test('constant-time hexadecimal comparison rejects malformed encodings', () => {
  assert.equal(constantTimeEqualHex('', ''), false);
  assert.equal(constantTimeEqualHex('zz', 'zz'), false);
  assert.equal(constantTimeEqualHex('0g', '0g'), false);
  assert.equal(constantTimeEqualHex('00', '00'), true);
});
