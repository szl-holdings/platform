import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';

import {
  type AttestationResultAlgorithm,
  type AttestationResultClaims,
  AttestationTokenError,
  type CapabilityClaims,
  CapabilityTokenError,
  canonicalJson,
  createAttestationChallenge,
  createGovernedActionEnvelope,
  GovernanceDeniedError,
  type GovernanceReceipt,
  type GovernedActionEnvelope,
  type GovernedActionRequest,
  type GovernedActionResult,
  type GovernedToolExecutor,
  InMemoryReplayStore,
  McpGovernor,
  type McpGovernorConfig,
  type PolicyDecision,
  type ReplayStore,
  sha256,
  signAttestationResultToken,
  signCapabilityToken,
  verifyAttestationResultToken,
  verifyCapabilityToken,
  verifyGovernanceReceipt,
} from './index.js';

const NOW = new Date('2026-07-26T03:00:00Z');
const { privateKey: capabilityPrivateKey, publicKey: capabilityPublicKey } =
  generateKeyPairSync('ed25519');
const { privateKey: receiptPrivateKey, publicKey: receiptPublicKey } =
  generateKeyPairSync('ed25519');
const { privateKey: attestationPrivateKey, publicKey: attestationPublicKey } =
  generateKeyPairSync('ed25519');

const ATTESTATION_ISSUER = 'https://verifier.szl.test';
const ATTESTATION_WORKLOAD = 'frontier-inference-1';
const ATTESTATION_MEASUREMENT = `sha384:${'a'.repeat(96)}`;
const ATTESTATION_QUOTE_DIGEST = `sha384:${'b'.repeat(96)}`;
const ATTESTATION_POLICY_DIGEST = `sha256:${'c'.repeat(64)}`;

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

function attestationConfig(
  overrides: Partial<NonNullable<McpGovernorConfig['attestation']>> = {},
): NonNullable<McpGovernorConfig['attestation']> {
  return {
    requiredRisks: ['high', 'critical'],
    references: [
      {
        attestationType: 'nvidia-cc',
        verifier: 'nvidia-nras',
        workloadId: ATTESTATION_WORKLOAD,
        issuers: [ATTESTATION_ISSUER],
        measurements: [ATTESTATION_MEASUREMENT],
        referencePolicyDigests: [ATTESTATION_POLICY_DIGEST],
      },
    ],
    publicKeyResolver: () => attestationPublicKey,
    maxResultAgeSeconds: 120,
    maxTokenLifetimeSeconds: 300,
    allowedClockSkewSeconds: 5,
    ...overrides,
  };
}

function attestationClaimsFor(
  governedRequest: GovernedActionRequest,
  overrides: Partial<AttestationResultClaims> = {},
): AttestationResultClaims {
  const envelope = createGovernedActionEnvelope(governedRequest, NOW);
  const capability = governedRequest.capabilityToken
    ? {
        claims: claims(),
        keyId: 'capability-key-1',
      }
    : undefined;
  const nowSeconds = Math.floor(NOW.getTime() / 1000);
  return {
    version: 'szl.attestation-result/v1',
    resultId: 'attestation-result-001',
    issuer: ATTESTATION_ISSUER,
    actionId: envelope.actionId,
    actorId: envelope.actorId,
    tenantId: envelope.tenantId,
    workloadId: ATTESTATION_WORKLOAD,
    attestationType: 'nvidia-cc',
    verifier: 'nvidia-nras',
    hardwareVerified: true,
    eatNonce: createAttestationChallenge(envelope, capability),
    quoteDigest: ATTESTATION_QUOTE_DIGEST,
    measurement: ATTESTATION_MEASUREMENT,
    referencePolicyDigest: ATTESTATION_POLICY_DIGEST,
    verifiedAt: nowSeconds - 5,
    expiresAt: nowSeconds + 120,
    ...overrides,
  };
}

function withAttestation(
  governedRequest: GovernedActionRequest,
  overrides: Partial<AttestationResultClaims> = {},
): GovernedActionRequest {
  return {
    ...governedRequest,
    attestationResultToken: signAttestationResultToken(
      attestationClaimsFor(governedRequest, overrides),
      attestationPrivateKey,
      'attestation-key-1',
    ),
  };
}

function createGovernor(
  receipts: GovernanceReceipt[],
  options: {
    policy?: (envelope: GovernedActionEnvelope, args: unknown) => Promise<PolicyDecision>;
    writer?: (receipt: GovernanceReceipt) => Promise<void>;
    replayStore?: ReplayStore;
    attestation?: McpGovernorConfig['attestation'];
  } = {},
): {
  run<T>(
    request: GovernedActionRequest,
    execute: (args: unknown, toolName: string) => Promise<T>,
  ): Promise<GovernedActionResult<T>>;
} {
  let activeExecutor: ((args: unknown, toolName: string) => Promise<unknown>) | undefined;
  const governor = new McpGovernor({
    policyEvaluator:
      options.policy ?? (async () => ({ effect: 'allow', reason: 'policy permits action' })),
    capabilityPublicKeyResolver: () => capabilityPublicKey,
    toolExecutor: async (toolName, args) => {
      if (!activeExecutor) throw new Error('test executor is not bound');
      return activeExecutor(args, toolName);
    },
    receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
    receiptWriter:
      options.writer ??
      (async (receipt) => {
        receipts.push(receipt);
      }),
    replayStore: options.replayStore,
    attestation: options.attestation,
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

test('signs and verifies relying-party attestation results across supported algorithms', async () => {
  const governedRequest = request();
  const { privateKey: es256PrivateKey, publicKey: es256PublicKey } = generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
  });
  const { privateKey: ps384PrivateKey, publicKey: ps384PublicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const cases: Array<{
    algorithm: AttestationResultAlgorithm;
    keyId: string;
    privateKey: typeof attestationPrivateKey;
    publicKey: typeof attestationPublicKey;
  }> = [
    {
      algorithm: 'EdDSA',
      keyId: 'attestation-ed25519',
      privateKey: attestationPrivateKey,
      publicKey: attestationPublicKey,
    },
    {
      algorithm: 'ES256',
      keyId: 'attestation-es256',
      privateKey: es256PrivateKey,
      publicKey: es256PublicKey,
    },
    {
      algorithm: 'PS384',
      keyId: 'attestation-ps384',
      privateKey: ps384PrivateKey,
      publicKey: ps384PublicKey,
    },
  ];

  for (const item of cases) {
    const resultClaims = attestationClaimsFor(governedRequest, {
      resultId: `attestation-${item.algorithm.toLowerCase()}`,
    });
    const token = signAttestationResultToken(
      resultClaims,
      item.privateKey,
      item.keyId,
      item.algorithm,
    );
    const verified = await verifyAttestationResultToken(token, () => item.publicKey, {
      now: NOW,
      expectedActionId: resultClaims.actionId,
      expectedActorId: resultClaims.actorId,
      expectedTenantId: resultClaims.tenantId,
      expectedEatNonce: resultClaims.eatNonce,
      references: attestationConfig().references,
      maxResultAgeSeconds: 120,
      maxTokenLifetimeSeconds: 300,
      allowedClockSkewSeconds: 5,
    });
    assert.equal(verified.algorithm, item.algorithm);
    assert.equal(verified.keyId, item.keyId);
    assert.equal(verified.claims.hardwareVerified, true);
    assert.equal(Object.isFrozen(verified.claims), true);
  }
});

test('requires a verified hardware attestation result for configured risks', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, { attestation: attestationConfig() });
  let executed = false;

  await assert.rejects(
    governor.run(request(), async () => {
      executed = true;
      return 'unreachable';
    }),
    (error: unknown) =>
      error instanceof GovernanceDeniedError &&
      error.decision.reason === 'attestation_token_required',
  );
  assert.equal(executed, false);
  assert.equal(receipts[0]?.phase, 'blocked');
});

test('requires a caller-stable action ID when an attestation result is supplied', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, { attestation: attestationConfig() });
  const governedRequest = withAttestation(request({ actionId: undefined }));

  await assert.rejects(
    governor.run(governedRequest, async () => 'unreachable'),
    (error: unknown) =>
      error instanceof GovernanceDeniedError &&
      error.decision.reason === 'attestation_action_id_required',
  );
});

test('binds admitted attestation to action, capability nonce, reference values, and receipts', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, { attestation: attestationConfig() });
  const governedRequest = withAttestation(request());

  const outcome = await governor.run(governedRequest, async () => ({ committed: true }));
  assert.equal(outcome.attestation?.claims.resultId, 'attestation-result-001');
  assert.equal(outcome.attestation?.claims.measurement, ATTESTATION_MEASUREMENT);
  assert.equal(receipts.length, 2);
  assert.equal(receipts[0]?.attestation?.claims.hardwareVerified, true);
  assert.equal(receipts[1]?.attestation?.claims.referencePolicyDigest, ATTESTATION_POLICY_DIGEST);
  assert.ok(receipts.every((receipt) => verifyGovernanceReceipt(receipt, receiptPublicKey)));

  const afterReceipt = receipts[1];
  assert.ok(afterReceipt?.attestation);
  const tampered = {
    ...afterReceipt,
    attestation: {
      ...afterReceipt.attestation,
      claims: {
        ...afterReceipt.attestation.claims,
        measurement: `sha384:${'f'.repeat(96)}`,
      },
    },
  } as GovernanceReceipt;
  assert.equal(verifyGovernanceReceipt(tampered, receiptPublicKey), false);
});

test('applies configured clock skew consistently to verification and replay admission', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, { attestation: attestationConfig() });
  const nowSeconds = Math.floor(NOW.getTime() / 1000);
  const governedRequest = withAttestation(request({ actionId: 'action-clock-skew' }), {
    resultId: 'attestation-clock-skew',
    verifiedAt: nowSeconds - 10,
    expiresAt: nowSeconds - 1,
  });

  const outcome = await governor.run(governedRequest, async () => ({ admitted: true }));
  assert.deepEqual(outcome.result, { admitted: true });
});

test('rejects a signed attestation result with a non-reference measurement', async () => {
  const receipts: GovernanceReceipt[] = [];
  const governor = createGovernor(receipts, { attestation: attestationConfig() });
  const governedRequest = withAttestation(request(), {
    measurement: `sha384:${'d'.repeat(96)}`,
  });
  let executed = false;

  await assert.rejects(
    governor.run(governedRequest, async () => {
      executed = true;
      return 'unreachable';
    }),
    (error: unknown) =>
      error instanceof GovernanceDeniedError &&
      error.decision.reason === 'attestation_measurement_not_allowed',
  );
  assert.equal(executed, false);
});

test('normalizes forged attestation appraisal probes in signed blocked receipts', async () => {
  const governedRequest = request();
  const { privateKey: untrustedPrivateKey } = generateKeyPairSync('ed25519');
  const cases: Array<Partial<AttestationResultClaims>> = [
    { attestationType: 'amd-sev-snp' },
    { verifier: 'amd-vcek' },
    { workloadId: 'untrusted-workload' },
    { issuer: 'https://untrusted-verifier.example' },
    { actionId: 'action-probe' },
    { measurement: `sha384:${'d'.repeat(96)}` },
    { referencePolicyDigest: `sha256:${'e'.repeat(64)}` },
  ];

  for (const overrides of cases) {
    const receipts: GovernanceReceipt[] = [];
    const governor = createGovernor(receipts, { attestation: attestationConfig() });
    const resultClaims = attestationClaimsFor(governedRequest, overrides);
    const token = signAttestationResultToken(
      resultClaims,
      untrustedPrivateKey,
      'attestation-key-1',
    );
    let executed = false;
    await assert.rejects(
      governor.run({ ...governedRequest, attestationResultToken: token }, async () => {
        executed = true;
        return 'unreachable';
      }),
      (error: unknown) =>
        error instanceof GovernanceDeniedError &&
        error.decision.reason === 'attestation_invalid_signature',
    );
    assert.equal(executed, false);
    assert.equal(receipts.length, 1);
    assert.equal(receipts[0]?.phase, 'blocked');
    assert.equal(receipts[0]?.reason, 'attestation_invalid_signature');
    assert.equal(verifyGovernanceReceipt(receipts[0] as GovernanceReceipt, receiptPublicKey), true);
  }
});

test('rejects stale, expired, and challenge-mismatched attestation results', async () => {
  const baseRequest = request();
  const nowSeconds = Math.floor(NOW.getTime() / 1000);
  const cases: Array<{
    overrides: Partial<AttestationResultClaims>;
    code: AttestationTokenError['code'];
  }> = [
    {
      overrides: { verifiedAt: nowSeconds - 200, expiresAt: nowSeconds + 10 },
      code: 'stale',
    },
    {
      overrides: { verifiedAt: nowSeconds - 100, expiresAt: nowSeconds - 10 },
      code: 'expired',
    },
    {
      overrides: { eatNonce: Buffer.alloc(32, 9).toString('base64url') },
      code: 'nonce_mismatch',
    },
  ];

  for (const item of cases) {
    const resultClaims = attestationClaimsFor(baseRequest, item.overrides);
    const token = signAttestationResultToken(
      resultClaims,
      attestationPrivateKey,
      'attestation-key-1',
    );
    await assert.rejects(
      verifyAttestationResultToken(token, () => attestationPublicKey, {
        now: NOW,
        expectedActionId: resultClaims.actionId,
        expectedActorId: resultClaims.actorId,
        expectedTenantId: resultClaims.tenantId,
        expectedEatNonce: attestationClaimsFor(baseRequest).eatNonce,
        references: attestationConfig().references,
        maxResultAgeSeconds: 120,
        maxTokenLifetimeSeconds: 300,
        allowedClockSkewSeconds: 5,
      }),
      (error: unknown) => error instanceof AttestationTokenError && error.code === item.code,
    );
  }
});

test('rejects replay of a one-use attestation result', async () => {
  const receipts: GovernanceReceipt[] = [];
  const config = attestationConfig({ requiredRisks: ['read_only'] });
  const governor = createGovernor(receipts, { attestation: config });
  const governedRequest = withAttestation(
    request({
      actionId: 'action-attested-read',
      toolName: 'ledger.read',
      risk: 'read_only',
      mutatesState: false,
      capabilityToken: undefined,
    }),
  );

  await governor.run(governedRequest, async () => ({ rows: 1 }));
  await assert.rejects(
    governor.run(governedRequest, async () => ({ rows: 2 })),
    (error: unknown) =>
      error instanceof GovernanceDeniedError && error.decision.reason === 'attestation_replay',
  );
});

test('rejects incomplete attestation admission configuration at construction', () => {
  assert.throws(
    () =>
      new McpGovernor({
        policyEvaluator: async () => ({ effect: 'allow', reason: 'policy permits action' }),
        capabilityPublicKeyResolver: () => capabilityPublicKey,
        toolExecutor: async () => undefined,
        receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
        receiptWriter: async () => undefined,
        attestation: {
          ...attestationConfig(),
          references: [],
        },
      }),
    /attestation\.references must not be empty/,
  );
});

test('rejects prototype-chain names as attestation risk classes', () => {
  for (const inheritedRisk of ['constructor', 'toString', '__proto__']) {
    assert.throws(
      () =>
        new McpGovernor({
          policyEvaluator: async () => ({ effect: 'allow', reason: 'policy permits action' }),
          capabilityPublicKeyResolver: () => capabilityPublicKey,
          toolExecutor: async () => undefined,
          receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
          receiptWriter: async () => undefined,
          attestation: {
            ...attestationConfig(),
            requiredRisks: [inheritedRisk] as unknown as NonNullable<
              McpGovernorConfig['attestation']
            >['requiredRisks'],
          },
        }),
      /attestation\.requiredRisks contains an unsupported risk/,
    );
  }
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

  assert.equal(canonicalJson(complete), '{"__proto__":{"scope":"governed"},"action":"write"}');
  assert.notEqual(sha256(canonicalJson(complete)), sha256(canonicalJson({ action: 'write' })));
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
    (error: unknown) => error instanceof CapabilityTokenError && error.code === 'issuer_mismatch',
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
    policy: async (envelope, args) => {
      const snapshot = args as typeof approvedArgs;
      assert.equal(Object.isFrozen(envelope), true);
      assert.equal(Object.isFrozen(snapshot), true);
      assert.equal(Object.isFrozen(snapshot.nested), true);
      assert.throws(() => {
        envelope.toolName = 'ledger.delete';
      }, TypeError);
      enterPolicy();
      await policyGate;
      return {
        effect: 'allow',
        reason: 'snapshot approved',
        policyVersion: 'covenant-2026-07',
      };
    },
  });

  const mutableRequest = request({ actionId: 'action-snapshot', args: originalArgs });
  const running = governor.run(mutableRequest, async (args, toolName) => {
    const snapshot = args as typeof approvedArgs;
    assert.equal(toolName, 'ledger.write');
    assert.equal(snapshot.amount, 10);
    assert.equal(snapshot.nested.value, 'approved');
    assert.equal(snapshot.__proto__.role, 'user');
    assert.throws(() => {
      snapshot.amount = 999;
    }, TypeError);
    return { amount: snapshot.amount, value: snapshot.nested.value };
  });

  await policyEntered;
  originalArgs.amount = 999;
  originalArgs.nested.value = 'mutated';
  originalArgs.__proto__.role = 'admin';
  mutableRequest.toolName = 'ledger.delete';
  mutableRequest.actorId = 'attacker';
  mutableRequest.tenantId = 'attacker-tenant';
  mutableRequest.risk = 'critical';
  mutableRequest.mutatesState = false;
  releasePolicy();

  const outcome = await running;
  assert.deepEqual(outcome.result, { amount: 10, value: 'approved' });
  assert.equal(outcome.envelope.toolName, 'ledger.write');
  assert.equal(outcome.envelope.actorId, 'actor-1');
  assert.equal(outcome.envelope.tenantId, 'tenant-1');
  assert.equal(outcome.envelope.risk, 'high');
  assert.equal(outcome.envelope.mutatesState, true);
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

  const outcome = await governor.run(request({ actionId: 'action-policy-version' }), async () => ({
    ok: true,
  }));
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

test('requires a callable governor-owned tool executor', async () => {
  assert.throws(
    () =>
      new McpGovernor({
        policyEvaluator: async () => ({ effect: 'allow', reason: 'policy permits action' }),
        capabilityPublicKeyResolver: () => capabilityPublicKey,
        toolExecutor: undefined as never,
        receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
        receiptWriter: async () => undefined,
        expectedCapabilityIssuer: 'szl-control-plane',
        clock: () => NOW,
      }),
    /toolExecutor must be callable/,
  );

  const receipts: GovernanceReceipt[] = [];
  let legacyCalled = false;
  const executorWithDefault: GovernedToolExecutor = async (_toolName, args = {}) =>
    (args as { amount: number }).amount;
  const governor = new McpGovernor({
    policyEvaluator: async () => ({ effect: 'allow', reason: 'policy permits action' }),
    capabilityPublicKeyResolver: () => capabilityPublicKey,
    toolExecutor: executorWithDefault,
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

  const running = governor.run(request({ actionId: 'action-decision-snapshot' }), async () => ({
    ok: true,
  }));
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

test('captures the configured executor before an in-flight request', async () => {
  const receipts: GovernanceReceipt[] = [];
  let enterPolicy!: () => void;
  let releasePolicy!: () => void;
  const policyEntered = new Promise<void>((resolve) => {
    enterPolicy = resolve;
  });
  const policyGate = new Promise<void>((resolve) => {
    releasePolicy = resolve;
  });
  const config: McpGovernorConfig = {
    policyEvaluator: async () => {
      enterPolicy();
      await policyGate;
      return { effect: 'allow', reason: 'policy permits action' };
    },
    capabilityPublicKeyResolver: () => capabilityPublicKey,
    toolExecutor: async (toolName, args) => ({
      amount: (args as { amount: number }).amount,
      executor: 'original',
      toolName,
    }),
    receiptSigner: { keyId: 'receipt-key-1', privateKey: receiptPrivateKey },
    receiptWriter: async (receipt) => {
      receipts.push(receipt);
    },
    expectedCapabilityIssuer: 'szl-control-plane',
    clock: () => NOW,
  };
  const governor = new McpGovernor(config);
  const running = governor.run<{
    amount: number;
    executor: string;
    toolName: string;
  }>(request({ actionId: 'action-config-snapshot' }));

  await policyEntered;
  config.toolExecutor = async () => ({
    amount: 999,
    executor: 'substituted',
    toolName: 'ledger.delete',
  });
  releasePolicy();

  const outcome = await running;
  assert.deepEqual(outcome.result, {
    amount: 10,
    executor: 'original',
    toolName: 'ledger.write',
  });
  assert.equal(Object.isFrozen(outcome.envelope), true);
});
