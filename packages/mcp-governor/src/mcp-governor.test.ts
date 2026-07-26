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
  InMemoryReplayStore,
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
    ) => Promise<{ effect: 'allow' | 'block'; reason: string }>;
    writer?: (receipt: GovernanceReceipt) => Promise<void>;
  } = {},
): McpGovernor {
  return new McpGovernor({
    policyEvaluator:
      options.policy ?? (async () => ({ effect: 'allow', reason: 'policy permits action' })),
    capabilityPublicKeyResolver: () => capabilityPublicKey,
    receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
    receiptWriter:
      options.writer ??
      (async (receipt) => {
        receipts.push(receipt);
      }),
    expectedCapabilityIssuer: 'szl-control-plane',
    clock: () => NOW,
  });
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
  assert.notEqual(canonicalJson(complete), canonicalJson({ a: 1 }));
  assert.equal(canonicalJson(complete), '{"__proto__":{"admin":true},"a":1}');
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
