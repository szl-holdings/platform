import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';

import {
  type CapabilityClaims,
  CapabilityTokenError,
  canonicalJson,
  GovernanceDeniedError,
  type GovernanceReceipt,
  type GovernedActionEnvelope,
  type GovernedActionRequest,
  type GovernedActionResult,
  InMemoryReplayStore,
  type PolicyDecision,
  type ReplayStore,
  McpGovernor,
  sha256,
  signCapabilityToken,
  verifyCapabilityToken,
  verifyGovernanceReceipt,
} from './index.js';

const NOW = new Date('2026-07-26T03:00:00Z');
const { privateKey: capabilityPrivateKey, publicKey: capabilityPublicKey } =
  generateKeyPairSync('ed25519');
const { privateKey: receiptPrivateKey, publicKey: receiptPublicKey } =
  generateKeyPairSync('ed25519');

function claims(overrides: Partial<CapabilityClaims> = {}): CapabilityClaims {
  const nowSeconds = Math.floor(NOW.getTime() / 1000);
  return {
    version: 'szl.capability/v1',
    tokenId: 'cap-001',
    issuer: 'szl-control-plane',
    subject: 'actor-1',
    tenantId: 'tenant-1',
    tools: ['ledger.write'],
    maxRisk: 'high',
    notBefore: nowSeconds - 60,
    expiresAt: nowSeconds + 300,
    nonce: 'nonce-001',
    ...overrides,
  };
}

function request(overrides: Partial<GovernedActionRequest> = {}): GovernedActionRequest {
  return {
    actionId: 'action-001',
    toolName: 'ledger.write',
    actorId: 'actor-1',
    tenantId: 'tenant-1',
    risk: 'high',
    mutatesState: true,
    args: { amount: 10 },
    capabilityToken: signCapabilityToken(claims(), capabilityPrivateKey, 'capability-key-1'),
    ...overrides,
  };
}

function createGovernor(
  receipts: GovernanceReceipt[],
  options: {
    policy?: (
      envelope: GovernedActionEnvelope,
      args: unknown,
    ) => Promise<PolicyDecision>;
    writer?: (receipt: GovernanceReceipt) => Promise<void>;
    replayStore?: ReplayStore;
  } = {},
): {
  run<T>(
    request: GovernedActionRequest,
    execute: (args: unknown) => Promise<T>,
  ): Promise<GovernedActionResult<T>>;
} {
  let activeExecutor: ((args: unknown) => Promise<unknown>) | undefined;
  const governor = new McpGovernor({
    policyEvaluator:
      options.policy ?? (async () => ({ effect: 'allow', reason: 'policy permits action' })),
    capabilityPublicKeyResolver: () => capabilityPublicKey,
    toolExecutor: async (_toolName, args) => {
      if (!activeExecutor) throw new Error('test executor is not bound');
      return activeExecutor(args);
    },
    receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
    receiptWriter:
      options.writer ??
      (async (receipt) => {
        receipts.push(receipt);
      }),
    replayStore: options.replayStore,
    expectedCapabilityIssuer: 'szl-control-plane',
    clock: () => NOW,
  });
  return {
    run: async (governedRequest, execute) => {
      if (activeExecutor) throw new Error('concurrent test execution is not supported');
      activeExecutor = execute;
      try {
        return await governor.run(governedRequest);
      } finally {
        activeExecutor = undefined;
      }
    },
  };
}

test('signs and verifies model-independent capability claims', async () => {
  const token = signCapabilityToken(claims(), capabilityPrivateKey, 'capability-key-1');
  const verified = await verifyCapabilityToken(token, () => capabilityPublicKey, {
    now: NOW,
    expectedIssuer: 'szl-control-plane',
    actorId: 'actor-1',
    tenantId: 'tenant-1',
    toolName: 'ledger.write',
    risk: 'high',
  });
  assert.equal(verified.claims.tokenId, 'cap-001');
  assert.equal(verified.keyId, 'capability-key-1');
});

test('rejects expired capability tokens', async () => {
  const nowSeconds = Math.floor(NOW.getTime() / 1000);
  const token = signCapabilityToken(
    claims({ notBefore: nowSeconds - 120, expiresAt: nowSeconds - 1 }),
    capabilityPrivateKey,
    'capability-key-1',
  );
  await assert.rejects(
    verifyCapabilityToken(token, () => capabilityPublicKey, {
      now: NOW,
      actorId: 'actor-1',
      tenantId: 'tenant-1',
      toolName: 'ledger.write',
      risk: 'high',
    }),
    (error: unknown) => error instanceof CapabilityTokenError && error.code === 'expired',
  );
});

test('fails closed when policy evaluation throws', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, {
    policy: async () => {
      throw new Error('backend unavailable');
    },
  });
  let executed = false;
  await assert.rejects(
    governor.run(request(), async () => {
      executed = true;
      return 'unreachable';
    }),
    (error: unknown) =>
      error instanceof GovernanceDeniedError && error.decision.reason === 'policy_evaluator_error',
  );
  assert.equal(executed, false);
  assert.equal(receipts[0]?.phase, 'blocked');
});

test('lets policy inspect arguments without writing raw arguments to receipts', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, {
    policy: async (_envelope, args) => ({
      effect: (args as { amount: number }).amount > 5 ? 'block' : 'allow',
      reason: 'amount ceiling',
    }),
  });
  await assert.rejects(
    governor.run(request({ args: { amount: 10, secret: 'do-not-persist' } }), async () => 'no'),
    GovernanceDeniedError,
  );
  assert.equal(JSON.stringify(receipts).includes('do-not-persist'), false);
});

test('requires a capability token before a state-changing action', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts);
  await assert.rejects(
    governor.run(request({ capabilityToken: undefined }), async () => 'unreachable'),
    (error: unknown) =>
      error instanceof GovernanceDeniedError &&
      error.decision.reason === 'capability_token_required',
  );
});

test('persists signed before and after receipts around a side effect', async () => {
  const receipts: GovernanceReceipt[] = [];
  const events: string[] = [];
  const governor = createGovernor(receipts, {
    writer: async (receipt) => {
      events.push(`receipt:${receipt.phase}`);
      receipts.push(receipt);
    },
  });
  const outcome = await governor.run(request(), async () => {
    events.push('effect');
    return { ok: true };
  });
  assert.deepEqual(events, ['receipt:before', 'effect', 'receipt:after']);
  assert.equal(outcome.receipts.length, 2);
  assert.equal(receipts[1]?.priorReceiptDigest, receipts[0]?.receiptDigest);
  assert.ok(receipts.every((receipt) => verifyGovernanceReceipt(receipt, receiptPublicKey)));
});

test('rejects replay of a one-use capability token', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts);
  await governor.run(request(), async () => 'first');
  await assert.rejects(
    governor.run(request({ actionId: 'action-002' }), async () => 'second'),
    (error: unknown) =>
      error instanceof GovernanceDeniedError && error.decision.reason === 'capability_replay',
  );
});

test('enforces capability tool and risk scopes', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts);
  await assert.rejects(
    governor.run(
      request({
        risk: 'critical',
        capabilityToken: signCapabilityToken(
          claims({ maxRisk: 'high' }),
          capabilityPrivateKey,
          'capability-key-1',
        ),
      }),
      async () => 'unreachable',
    ),
    (error: unknown) =>
      error instanceof GovernanceDeniedError &&
      error.decision.reason === 'capability_risk_exceeded',
  );
});

test('forbids read-only actions from declaring a state mutation', async () => {
  const governor = createGovernor([]);
  await assert.rejects(
    governor.run(request({ risk: 'read_only', mutatesState: true }), async () => 'unreachable'),
    /read_only actions cannot declare a state mutation/,
  );
});

test('records one immutable after receipt for a read-only action', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts);
  const outcome = await governor.run(
    request({
      actionId: 'action-read',
      toolName: 'ledger.read',
      risk: 'read_only',
      mutatesState: false,
      capabilityToken: undefined,
    }),
    async () => ({ rows: 2 }),
  );
  assert.equal(outcome.receipts.length, 1);
  assert.equal(receipts[0]?.phase, 'after');
  assert.equal(receipts[0]?.mutatesState, false);
  assert.equal(Object.isFrozen(receipts[0]), true);
  assert.equal(Object.isFrozen(receipts[0]?.signature), true);
});

test('prevents a side effect when the before-receipt cannot be persisted', async () => {
  let executed = false;
  const governor = createGovernor([], {
    writer: async () => {
      throw new Error('receipt store unavailable');
    },
  });
  await assert.rejects(
    governor.run(request(), async () => {
      executed = true;
      return 'unreachable';
    }),
    /receipt store unavailable/,
  );
  assert.equal(executed, false);
});

test('binds own __proto__ keys into canonical argument digests', () => {
  const complete = JSON.parse('{"a":1,"__proto__":{"admin":true}}') as unknown;
  const stripped = { a: 1 };
  assert.notEqual(canonicalJson(complete), canonicalJson(stripped));
  assert.notEqual(sha256(canonicalJson(complete)), sha256(canonicalJson(stripped)));
  assert.equal(canonicalJson(complete), '{"__proto__":{"admin":true},"a":1}');
  assert.equal(({} as { admin?: boolean }).admin, undefined);
});

test('preserves nested prototype-like keys without digest collisions or pollution', () => {
  const complete = JSON.parse(
    '{"outer":{"prototype":{"level":"own"},"constructor":{"prototype":{"polluted":true}},"__proto__":{"admin":true}}}',
  ) as unknown;
  const stripped = JSON.parse(
    '{"outer":{"prototype":{"level":"own"},"constructor":{"prototype":{"polluted":true}}}}',
  ) as unknown;

  assert.equal(
    canonicalJson(complete),
    '{"outer":{"__proto__":{"admin":true},"constructor":{"prototype":{"polluted":true}},"prototype":{"level":"own"}}}',
  );
  assert.notEqual(sha256(canonicalJson(complete)), sha256(canonicalJson(stripped)));
  assert.equal(({} as { admin?: boolean; polluted?: boolean }).admin, undefined);
  assert.equal(({} as { admin?: boolean; polluted?: boolean }).polluted, undefined);
});

test('binds defined prototype keys on null-prototype inputs', () => {
  const complete = Object.create(null) as Record<string, unknown>;
  Object.defineProperty(complete, '__proto__', {
    enumerable: true,
    value: { scope: 'governed' },
  });
  complete.action = 'write';

  assert.equal(
    canonicalJson(complete),
    '{"__proto__":{"scope":"governed"},"action":"write"}',
  );
  assert.notEqual(
    sha256(canonicalJson(complete)),
    sha256(canonicalJson({ action: 'write' })),
  );
});

test('canonicalizes a void action result before persisting the after receipt', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts);
  const outcome = await governor.run(request(), async () => undefined);
  assert.equal(outcome.result, undefined);
  assert.equal(receipts.length, 2);
  assert.equal(receipts[1]?.phase, 'after');
  assert.equal(receipts[1]?.outcome, 'success');
  assert.equal(receipts[1]?.resultDigest, sha256(canonicalJson(null)));
});

test('expires replay entries and rejects already-expired inserts', async () => {
  const store = new InMemoryReplayStore();
  assert.equal(await store.consume('cap-1', 100, 99), true);
  assert.equal(await store.consume('cap-1', 100, 99), false);
  assert.equal(await store.consume('already-expired', 99, 100), false);
  assert.equal(await store.consume('cap-2', 101, 100), true);
  assert.equal(await store.consume('cap-1', 102, 100), true);
});

test('rejects unexpected issuers before resolving a public key', async () => {
  const token = signCapabilityToken(
    claims({ issuer: 'untrusted-control-plane' }),
    capabilityPrivateKey,
    'capability-key-1',
  );
  let resolverCalls = 0;

  await assert.rejects(
    verifyCapabilityToken(
      token,
      () => {
        resolverCalls += 1;
        return capabilityPublicKey;
      },
      {
        now: NOW,
        expectedIssuer: 'szl-control-plane',
        actorId: 'actor-1',
        tenantId: 'tenant-1',
        toolName: 'ledger.write',
        risk: 'high',
      },
    ),
    (error: unknown) =>
      error instanceof CapabilityTokenError && error.code === 'issuer_mismatch',
  );
  assert.equal(resolverCalls, 0);
});

test('binds policy and execution to an immutable canonical argument snapshot', async () => {
  const receipts: GovernanceReceipt[] = [];
  let enterPolicy!: () => void;
  let releasePolicy!: () => void;
  const policyEntered = new Promise<void>((resolve) => {
    enterPolicy = resolve;
  });
  const policyGate = new Promise<void>((resolve) => {
    releasePolicy = resolve;
  });
  const approvedArgs = JSON.parse(
    '{"amount":10,"nested":{"value":"approved"},"__proto__":{"role":"user"}}',
  ) as {
    amount: number;
    nested: { value: string };
    __proto__: { role: string };
  };
  const originalArgs = JSON.parse(canonicalJson(approvedArgs)) as typeof approvedArgs;
  const governor = createGovernor(receipts, {
    policy: async (_envelope, args) => {
      const snapshot = args as typeof approvedArgs;
      assert.equal(Object.isFrozen(snapshot), true);
      assert.equal(Object.isFrozen(snapshot.nested), true);
      enterPolicy();
      await policyGate;
      return {
        effect: 'allow',
        reason: 'snapshot approved',
        policyVersion: 'covenant-2026-07',
      };
    },
  });

  const running = governor.run(
    request({ actionId: 'action-snapshot', args: originalArgs }),
    async (args) => {
      const snapshot = args as typeof approvedArgs;
      assert.equal(snapshot.amount, 10);
      assert.equal(snapshot.nested.value, 'approved');
      assert.equal(snapshot.__proto__.role, 'user');
      assert.throws(() => {
        snapshot.amount = 999;
      }, TypeError);
      return { amount: snapshot.amount, value: snapshot.nested.value };
    },
  );

  await policyEntered;
  originalArgs.amount = 999;
  originalArgs.nested.value = 'mutated';
  originalArgs.__proto__.role = 'admin';
  releasePolicy();

  const outcome = await running;
  assert.deepEqual(outcome.result, { amount: 10, value: 'approved' });
  assert.equal(outcome.envelope.argsDigest, sha256(canonicalJson(approvedArgs)));
});

test('persists the evaluated policy version in signed receipts', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, {
    policy: async () => ({
      effect: 'allow',
      reason: 'versioned policy permits action',
      policyVersion: 'covenant-2026-07',
    }),
  });

  const outcome = await governor.run(
    request({ actionId: 'action-policy-version' }),
    async () => ({ ok: true }),
  );
  assert.equal(outcome.decision.policyVersion, 'covenant-2026-07');
  assert.deepEqual(
    receipts.map((item) => item.policyVersion),
    ['covenant-2026-07', 'covenant-2026-07'],
  );
  assert.ok(receipts.every((item) => verifyGovernanceReceipt(item, receiptPublicKey)));

  const afterReceipt = receipts[1];
  assert.ok(afterReceipt);
  const tampered = {
    ...afterReceipt,
    policyVersion: 'covenant-tampered',
  } as GovernanceReceipt;
  assert.equal(verifyGovernanceReceipt(tampered, receiptPublicKey), false);
});

test('binds error receipts to stable failure codes and messages', async () => {
  const timeoutReceipts: GovernanceReceipt[] = [];
  const timeoutGovernor = createGovernor(timeoutReceipts);
  const timeout = Object.assign(new Error('upstream timed out'), { code: 'ETIMEDOUT' });

  await assert.rejects(
    timeoutGovernor.run(request({ actionId: 'action-timeout' }), async () => {
      throw timeout;
    }),
    (error: unknown) => error === timeout,
  );
  const timeoutReceipt = timeoutReceipts.find((item) => item.outcome === 'error');
  assert.ok(timeoutReceipt);
  assert.equal(
    timeoutReceipt.resultDigest,
    sha256(canonicalJson({ code: 'ETIMEDOUT', message: 'upstream timed out' })),
  );
  assert.equal(JSON.stringify(timeoutReceipt).includes('upstream timed out'), false);

  const deniedReceipts: GovernanceReceipt[] = [];
  const deniedGovernor = createGovernor(deniedReceipts);
  const denied = Object.assign(new Error('permission denied'), { code: 'EACCES' });
  await assert.rejects(
    deniedGovernor.run(request({ actionId: 'action-denied' }), async () => {
      throw denied;
    }),
    (error: unknown) => error === denied,
  );
  const deniedReceipt = deniedReceipts.find((item) => item.outcome === 'error');
  assert.ok(deniedReceipt);
  assert.notEqual(deniedReceipt.resultDigest, timeoutReceipt.resultDigest);
  assert.equal(
    deniedReceipt.resultDigest,
    sha256(canonicalJson({ code: 'EACCES', message: 'permission denied' })),
  );
});

test('requires a structurally controlled tool executor', async () => {
  assert.throws(
    () =>
      new McpGovernor({
        policyEvaluator: async () => ({ effect: 'allow', reason: 'policy permits action' }),
        capabilityPublicKeyResolver: () => capabilityPublicKey,
        toolExecutor: async () => 'legacy closure',
        receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
        receiptWriter: async () => undefined,
        expectedCapabilityIssuer: 'szl-control-plane',
        clock: () => NOW,
      }),
    /toolExecutor must accept toolName and governed args/,
  );

  const receipts: GovernanceReceipt[] = [];
  let legacyCalled = false;
  const governor = new McpGovernor({
    policyEvaluator: async () => ({ effect: 'allow', reason: 'policy permits action' }),
    capabilityPublicKeyResolver: () => capabilityPublicKey,
    toolExecutor: async (_toolName, args) => (args as { amount: number }).amount,
    receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
    receiptWriter: async (receipt) => {
      receipts.push(receipt);
    },
    expectedCapabilityIssuer: 'szl-control-plane',
    clock: () => NOW,
  });
  const mutableArgs = { amount: 10 };
  const legacyExecutor = async () => {
    legacyCalled = true;
    return mutableArgs.amount;
  };
  const runWithLegacyArgument = governor.run.bind(governor) as unknown as (
    governedRequest: GovernedActionRequest,
    ignoredLegacyExecutor: () => Promise<number>,
  ) => Promise<GovernedActionResult<number>>;
  const outcome = await runWithLegacyArgument(
    request({ actionId: 'action-legacy-executor', args: mutableArgs }),
    legacyExecutor,
  );
  assert.equal(outcome.result, 10);
  assert.equal(legacyCalled, false);
  assert.equal(receipts.length, 2);
});

test('snapshots and freezes a mutable policy decision before later awaits', async () => {
  const receipts: GovernanceReceipt[] = [];
  let enterReplay!: () => void;
  let releaseReplay!: () => void;
  const replayEntered = new Promise<void>((resolve) => {
    enterReplay = resolve;
  });
  const replayGate = new Promise<void>((resolve) => {
    releaseReplay = resolve;
  });
  const replayStore: ReplayStore = {
    consume: async () => {
      enterReplay();
      await replayGate;
      return true;
    },
  };
  const mutableDecision: PolicyDecision = {
    effect: 'allow',
    reason: 'original authorization',
    policyVersion: 'covenant-original',
  };
  const governor = createGovernor(receipts, {
    policy: async () => mutableDecision,
    replayStore,
  });

  const running = governor.run(
    request({ actionId: 'action-decision-snapshot' }),
    async () => ({ ok: true }),
  );
  await replayEntered;
  mutableDecision.reason = 'mutated authorization';
  mutableDecision.policyVersion = 'covenant-mutated';
  releaseReplay();

  const outcome = await running;
  assert.equal(Object.isFrozen(outcome.decision), true);
  assert.equal(outcome.decision.reason, 'original authorization');
  assert.equal(outcome.decision.policyVersion, 'covenant-original');
  assert.deepEqual(
    receipts.map((item) => [item.reason, item.policyVersion]),
    [
      ['original authorization', 'covenant-original'],
      ['original authorization', 'covenant-original'],
    ],
  );
});

test('records an error receipt when error metadata accessors throw', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts);
  const hostileError = new Error('opaque failure') as Error & { code?: string };
  Object.defineProperty(hostileError, 'code', {
    get() {
      throw new Error('code accessor denied');
    },
  });

  await assert.rejects(
    governor.run(request({ actionId: 'action-hostile-error' }), async () => {
      throw hostileError;
    }),
    (error: unknown) => error === hostileError,
  );
  const errorReceipt = receipts.find((item) => item.outcome === 'error');
  assert.ok(errorReceipt);
  assert.equal(
    errorReceipt.resultDigest,
    sha256(canonicalJson({ code: 'Error', message: 'opaque failure' })),
  );
  assert.equal(verifyGovernanceReceipt(errorReceipt, receiptPublicKey), true);
});
