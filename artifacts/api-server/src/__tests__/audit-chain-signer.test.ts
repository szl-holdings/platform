/**
 * Audit Chain Signer — Unit Tests (Task #4263)
 *
 * Covers acceptance gates G3–G8:
 *   G4: legacy_unsigned (no sigs present, pre-DID row)
 *   G5: partial_signature_tamper (one sig stripped → broken before crypto)
 *   G3: hybrid sign+verify round-trip → hybrid_verified
 *   G5: payload tamper (action/actor mutated after signing → broken)
 *   G5: DID substitution attack (signingDid swapped → broken)
 *   G8: handleSigningFailure warn/enforce rollout gating
 *
 * ML-DSA-65 is mocked with a Node.js HMAC-SHA256 scheme because the vite/vitest
 * ESM transform of @noble/post-quantum TypeScript source returns a non-standard
 * compact key format from keygen(seed) that breaks sign() at test runtime.
 * The mock is sufficient to test classifier logic: sign produces HMAC(key, msg),
 * verify compares constant-time. Ed25519 uses the real @noble/curves implementation.
 *
 * DB paths (registry cross-check) return empty arrays → verifyAuditRow falls
 * back to row-embedded keys (registryCrossCheck: 'skipped').
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── ML-DSA mock (HMAC-SHA256 stand-in) ────────────────────────────────────
// Must be declared before the pqc-identity import so that generateHybridKeyPair
// picks up the mock when it calls ml_dsa65.keygen / sign internally.
vi.mock('@noble/post-quantum/ml-dsa.js', async () => {
  const { createHmac } = await import('node:crypto');
  function sign(secretKey: Uint8Array, message: Uint8Array): Uint8Array {
    return new Uint8Array(createHmac('sha256', secretKey).update(message).digest());
  }
  function verify(publicKey: Uint8Array, message: Uint8Array, sig: Uint8Array): boolean {
    const expected = new Uint8Array(createHmac('sha256', publicKey).update(message).digest());
    if (sig.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) diff |= sig[i]! ^ expected[i]!;
    return diff === 0;
  }
  return {
    ml_dsa65: {
      // keygen: seed → compact 32-byte representation (secretKey = publicKey = seed)
      keygen: (seed?: Uint8Array) => {
        const key = seed?.slice(0, 32) ?? new Uint8Array(32);
        return { secretKey: key, publicKey: key };
      },
      sign,
      verify,
    },
  };
});

// ── DB mock (registry cross-check: no rows → row-embedded key fallback) ───
vi.mock('@szl-holdings/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => [] }),
      }),
    }),
  },
  platformKeysTable: {},
  platformDidsTable: {},
  platformDidDocumentsTable: {},
  didWebvhLogTable: {},
  auditChainEventsTable: {},
}));

vi.mock('../lib/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ── Imports after mocks ────────────────────────────────────────────────────
import {
  buildCanonicalPayload,
  verifyAuditRow,
  handleSigningFailure,
  computeLambdaReceipt,
  type VerifyRowInput,
} from '../lib/audit-chain-signer.js';
import { generateHybridKeyPair, createHybridSigner } from '@szl-holdings/pqc-identity';

// ── Helpers ────────────────────────────────────────────────────────────────

function buildTestRow(overrides?: Partial<VerifyRowInput>): VerifyRowInput {
  return {
    id: 1,
    prevHash: 'genesis',
    action: 'test:action',
    actorLabel: 'test-agent',
    domain: 'platform',
    actionType: 'agent_action',
    entityId: 'szl://test/1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    signingDid: 'did:plat:agent:test-agent',
    ed25519Sig: null,
    mldsa65Sig: null,
    sigPublicKeyEd25519: null,
    sigPublicKeyMldsa65: null,
    keyId: null,
    ...overrides,
  };
}

/**
 * Sign a test row using generateHybridKeyPair + createHybridSigner.
 * ML-DSA uses the HMAC mock above; Ed25519 uses the real noble implementation.
 */
function signTestRow(row: VerifyRowInput & { signingDid: string }) {
  const keyPair = generateHybridKeyPair();
  const signer = createHybridSigner(keyPair, 'hybrid');
  const payload = buildCanonicalPayload({
    prevHash: row.prevHash,
    action: row.action,
    actor: row.actorLabel,
    domain: row.domain,
    actionType: row.actionType,
    entityId: row.entityId ?? '',
    createdAt: row.createdAt.toISOString(),
    signingDid: row.signingDid,
  });
  const sig = signer.sign(payload);
  return {
    ed25519Sig: sig.ed25519 ?? '',
    mldsa65Sig: sig.mldsa65 ?? '',
    sigPublicKeyEd25519: sig.publicKeys?.ed25519 ?? '',
    sigPublicKeyMldsa65: sig.publicKeys?.mldsa65 ?? '',
    keyId: 'test-key-1',
  };
}

// Plausible-looking but never-valid hex (all-zeros, 64 bytes)
const DUMMY_HEX = '0'.repeat(128);

// ── Tests ──────────────────────────────────────────────────────────────────

describe('verifyAuditRow — row classification', () => {
  it('G4: fully unsigned row (no sigs) → legacy_unsigned', async () => {
    const result = await verifyAuditRow(buildTestRow());
    expect(result.status).toBe('legacy_unsigned');
  });

  it('G5: ed25519Sig present, mldsa65Sig null → broken:partial_signature_tamper', async () => {
    // Tamper detection fires before any crypto — DUMMY_HEX is sufficient
    const result = await verifyAuditRow(
      buildTestRow({
        ed25519Sig: DUMMY_HEX,
        mldsa65Sig: null,
        sigPublicKeyEd25519: DUMMY_HEX,
        sigPublicKeyMldsa65: DUMMY_HEX,
      }),
    );
    expect(result.status).toBe('broken');
    expect(result.reason).toBe('partial_signature_tamper');
  });

  it('G5: mldsa65Sig present, ed25519Sig null → broken:partial_signature_tamper', async () => {
    const result = await verifyAuditRow(
      buildTestRow({
        ed25519Sig: null,
        mldsa65Sig: DUMMY_HEX,
        sigPublicKeyEd25519: DUMMY_HEX,
        sigPublicKeyMldsa65: DUMMY_HEX,
      }),
    );
    expect(result.status).toBe('broken');
    expect(result.reason).toBe('partial_signature_tamper');
  });

  it('G3: freshly signed row (both sigs valid) → hybrid_verified', async () => {
    const base = buildTestRow();
    const sigs = signTestRow(base as VerifyRowInput & { signingDid: string });
    const result = await verifyAuditRow({ ...base, ...sigs });
    expect(result.status).toBe('hybrid_verified');
    expect(result.ed25519Valid).toBe(true);
    expect(result.mldsa65Valid).toBe(true);
  });

  it('G5: action field mutated after signing → broken', async () => {
    const base = buildTestRow();
    const sigs = signTestRow(base as VerifyRowInput & { signingDid: string });
    const result = await verifyAuditRow({ ...base, ...sigs, action: 'tampered:action' });
    expect(result.status).toBe('broken');
  });

  it('G5: actor field mutated after signing → broken', async () => {
    const base = buildTestRow();
    const sigs = signTestRow(base as VerifyRowInput & { signingDid: string });
    const result = await verifyAuditRow({ ...base, ...sigs, actorLabel: 'mallory' });
    expect(result.status).toBe('broken');
  });

  it('G5: signingDid substituted after signing → broken', async () => {
    const base = buildTestRow();
    const sigs = signTestRow(base as VerifyRowInput & { signingDid: string });
    const result = await verifyAuditRow({
      ...base,
      ...sigs,
      signingDid: 'did:plat:agent:impersonator',
    });
    expect(result.status).toBe('broken');
  });
});

describe('handleSigningFailure — rollout gating (G8)', () => {
  beforeEach(() => {
    delete process.env.AUDIT_CHAIN_ROLLOUT;
    (globalThis as Record<string, unknown>).__auditChainSigningFailures = 0;
  });
  afterEach(() => {
    delete process.env.AUDIT_CHAIN_ROLLOUT;
  });

  it('warn mode (default): shouldAbort=false, failure counter increments', () => {
    const result = handleSigningFailure(new Error('test-error'), { context: 'test' });
    expect(result.shouldAbort).toBe(false);
    expect((globalThis as Record<string, unknown>).__auditChainSigningFailures).toBe(1);
  });

  it('warn mode (explicit AUDIT_CHAIN_ROLLOUT=warn): counter accumulates', () => {
    process.env.AUDIT_CHAIN_ROLLOUT = 'warn';
    handleSigningFailure(new Error('e1'), {});
    handleSigningFailure(new Error('e2'), {});
    expect((globalThis as Record<string, unknown>).__auditChainSigningFailures).toBe(2);
  });

  it('enforce mode (AUDIT_CHAIN_ROLLOUT=enforce): shouldAbort=true', () => {
    process.env.AUDIT_CHAIN_ROLLOUT = 'enforce';
    const result = handleSigningFailure(new Error('signing-down'), { context: 'enforce-test' });
    expect(result.shouldAbort).toBe(true);
  });
});

describe('computeLambdaReceipt — Ouroboros Thesis v3 four-axis Λ', () => {
  it('hybrid_verified row with both sigs valid + registry passed → Λ = 1.0', () => {
    const r = computeLambdaReceipt({
      status: 'hybrid_verified',
      ed25519Valid: true,
      mldsa65Valid: true,
      registryCrossCheck: 'passed',
      hasSigMetadata: true,
    });
    expect(r.C).toBe(1);
    expect(r.H).toBe(1);
    expect(r.R).toBe(1);
    expect(r.F).toBe(1);
    expect(r.lambda).toBe(1);
    expect(r.axiomSet).toBe('lutar-v3-4axis');
  });

  it('legacy_unsigned row → all axes 0.5–1.0, Λ ≈ (0.5·1·0.5·0.5)^(1/4) ≈ 0.595', () => {
    const r = computeLambdaReceipt({
      status: 'legacy_unsigned',
      hasSigMetadata: false,
      registryCrossCheck: 'skipped',
    });
    expect(r.C).toBe(0.5);
    expect(r.H).toBe(1);
    expect(r.R).toBe(0.5);
    expect(r.F).toBe(0.5);
    expect(r.lambda).toBeCloseTo(Math.pow(0.5 * 1 * 0.5 * 0.5, 0.25), 6);
    expect(r.lambda).toBeGreaterThan(0.5);
    expect(r.lambda).toBeLessThan(0.7);
  });

  it('zero-pinning axiom: broken row with any axis = 0 → Λ = 0', () => {
    const r = computeLambdaReceipt({
      status: 'broken',
      ed25519Valid: false,
      mldsa65Valid: false,
      registryCrossCheck: 'failed',
      hasSigMetadata: true,
    });
    expect(r.C).toBe(0);
    expect(r.F).toBe(0);
    expect(r.lambda).toBe(0);
  });

  it('verifyAuditRow attaches a lambdaReceipt to legacy_unsigned classification', async () => {
    const result = await verifyAuditRow(buildTestRow());
    expect(result.status).toBe('legacy_unsigned');
    expect(result.lambdaReceipt).toBeDefined();
    expect(result.lambdaReceipt!.axiomSet).toBe('lutar-v3-4axis');
    expect(result.lambdaReceipt!.lambda).toBeGreaterThan(0);
    expect(result.lambdaReceipt!.lambda).toBeLessThanOrEqual(1);
  });
});
